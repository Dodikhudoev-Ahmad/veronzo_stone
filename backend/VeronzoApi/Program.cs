using System.Net;
using System.Text;
using System.Threading.RateLimiting;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using VeronzoApi.Data;
using VeronzoApi.Endpoints;
using VeronzoApi.Endpoints.Admin;
using VeronzoApi.Endpoints.Public;
using VeronzoApi.Models;
using VeronzoApi.Services;
using VeronzoApi.Validators;

var builder = WebApplication.CreateBuilder(args);

const string CorsPolicyName = "Frontend";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["https://veronzotj.netlify.app"];

builder.Services.AddOpenApi();

// Railway attaches a persistent volume and exposes its mount path via this env var;
// falling back to a local file keeps `dotnet run` working outside Railway.
var railwayVolumePath = Environment.GetEnvironmentVariable("RAILWAY_VOLUME_MOUNT_PATH");
var defaultConnectionString = railwayVolumePath is not null
    ? $"Data Source={Path.Combine(railwayVolumePath, "veronzo.db")}"
    : "Data Source=veronzo.db";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? defaultConnectionString));

builder.Services.Configure<ResendOptions>(builder.Configuration.GetSection(ResendOptions.SectionName));
builder.Services.AddHttpClient<IEmailSender, ResendEmailSender>(client =>
{
    client.BaseAddress = new Uri("https://api.resend.com/");
});
builder.Services.AddSingleton<IEmailNotificationQueue, EmailNotificationQueue>();
builder.Services.AddHostedService<EmailNotificationBackgroundService>();

builder.Services.AddValidatorsFromAssemblyContaining<ContactRequestValidator>();

// JWT signing secret must come from configuration/environment (Jwt__Secret) — the app
// refuses to start in Production without one of sufficient length, rather than
// silently signing tokens with a weak or missing key.
var jwtSecret = builder.Configuration["Jwt:Secret"];
if (builder.Environment.IsProduction())
{
    if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32)
    {
        throw new InvalidOperationException(
            "Jwt:Secret is missing or shorter than 32 characters. Set Jwt__Secret to a random secret before starting in Production.");
    }
}
else if (string.IsNullOrWhiteSpace(jwtSecret))
{
    // Dev-only fallback so `dotnet run` works locally without extra setup; never used
    // when ASPNETCORE_ENVIRONMENT=Production (the Dockerfile sets this for Railway).
    jwtSecret = "dev-only-insecure-jwt-signing-secret-do-not-use-in-prod";
}

var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "veronzo-api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "veronzo-admin";
var jwtAccessMinutes = builder.Configuration.GetValue<int?>("Jwt:AccessTokenMinutes") ?? 15;
var jwtRefreshDays = builder.Configuration.GetValue<int?>("Jwt:RefreshTokenDays") ?? 30;

builder.Services.Configure<JwtOptions>(o =>
{
    o.Issuer = jwtIssuer;
    o.Audience = jwtAudience;
    o.Secret = jwtSecret;
    o.AccessTokenMinutes = jwtAccessMinutes;
    o.RefreshTokenDays = jwtRefreshDays;
});
builder.Services.AddSingleton<IPasswordHasher<AdminUser>, PasswordHasher<AdminUser>>();
builder.Services.AddSingleton<ITokenService, TokenService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

// Railway terminates TLS at its edge and forwards plain HTTP to this container over a
// single internal hop, so X-Forwarded-For/X-Forwarded-Proto need to be applied for
// RemoteIpAddress (and therefore the rate limiter partition key) to reflect the real
// client IP instead of Railway's proxy. We deliberately do NOT clear KnownProxies/
// KnownNetworks: doing so would make the middleware accept X-Forwarded-For from any
// caller, letting anyone spoof their IP and dodge (or frame another client for)
// rate limiting. Railway's actual edge-proxy IP/network isn't published anywhere
// reliable, so by default nothing beyond ASP.NET Core's built-in loopback trust is
// configured here — meaning until an operator sets ForwardedHeaders:KnownProxies (or
// :KnownNetworks) to Railway's real proxy address, forwarded headers are NOT trusted
// and rate limiting partitions on whatever IP directly connects to Kestrel (Railway's
// proxy) rather than the true per-visitor IP. This is a known, documented limitation
// (see backend/README.md) rather than a silently-broken "it just works" claim.
var forwardedKnownProxies = builder.Configuration.GetSection("ForwardedHeaders:KnownProxies").Get<string[]>() ?? [];
var forwardedKnownNetworks = builder.Configuration.GetSection("ForwardedHeaders:KnownNetworks").Get<string[]>() ?? [];

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.ForwardLimit = 1;

    foreach (var proxy in forwardedKnownProxies)
    {
        if (IPAddress.TryParse(proxy, out var ip))
        {
            options.KnownProxies.Add(ip);
        }
    }

    foreach (var network in forwardedKnownNetworks)
    {
        var parts = network.Split('/', 2);
        if (parts.Length == 2 && IPAddress.TryParse(parts[0], out var prefix) && int.TryParse(parts[1], out var prefixLength))
        {
            options.KnownIPNetworks.Add(new System.Net.IPNetwork(prefix, prefixLength));
        }
    }
});

builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicyName, policy =>
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

var app = builder.Build();

// Must run before anything that reads scheme/remote IP (CORS origin checks, the
// rate limiter's IP-based partitioning, request logging) — otherwise those all see
// Railway's proxy connection instead of the forwarded values.
app.UseForwardedHeaders();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    await DbSeeder.SeedCatalogContentAsync(db);

    var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<AdminUser>>();
    var seedLogger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    await DbSeeder.SeedAdminUserAsync(db, passwordHasher, builder.Configuration, seedLogger);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Railway terminates TLS at its edge proxy and forwards plain HTTP to the container,
// so redirecting to HTTPS inside the app would just loop.
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// CORS responses here vary by Origin (specific allowed origins, not a wildcard) —
// without this header, a shared/browser cache could serve one origin's cached
// response to a different origin. Registered before UseCors (as an OnStarting
// callback) so it still fires for preflight OPTIONS requests, which CorsMiddleware
// answers directly without calling further into the pipeline.
app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
        var vary = context.Response.Headers.Vary;
        if (!vary.Any(v => v is not null && v.Contains("Origin", StringComparison.OrdinalIgnoreCase)))
        {
            context.Response.Headers.Vary = Microsoft.Extensions.Primitives.StringValues.Concat(vary, "Origin");
        }
        return Task.CompletedTask;
    });
    await next();
});

app.UseCors(CorsPolicyName);
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapAuthEndpoints();

app.MapAdminCategoryEndpoints();
app.MapAdminProductEndpoints();
app.MapAdminPortfolioItemEndpoints();
app.MapAdminGalleryItemEndpoints();
app.MapAdminHeroStatEndpoints();
app.MapAdminSiteContentEndpoints();
app.MapAdminSocialLinkEndpoints();
app.MapAdminContactInfoEndpoints();
app.MapAdminSeoMetaEndpoints();

app.MapPublicCategoryEndpoints();
app.MapPublicProductEndpoints();
app.MapPublicPortfolioItemEndpoints();
app.MapPublicGalleryItemEndpoints();
app.MapPublicHeroStatEndpoints();
app.MapPublicSiteContentEndpoints();
app.MapPublicSocialLinkEndpoints();
app.MapPublicContactInfoEndpoints();
app.MapPublicSeoMetaEndpoints();

app.MapPost("/api/contact", async (
        ContactRequestDto dto,
        IValidator<ContactRequestDto> validator,
        AppDbContext db,
        IEmailNotificationQueue emailQueue,
        CancellationToken cancellationToken) =>
    {
        var validationResult = await validator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            return Results.ValidationProblem(validationResult.ToDictionary());
        }

        var entity = new ContactRequest
        {
            Name = dto.Name.Trim(),
            Contact = dto.Contact.Trim(),
            Email = dto.Email?.Trim(),
            Type = dto.Type?.Trim(),
            Message = dto.Message?.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        db.ContactRequests.Add(entity);
        await db.SaveChangesAsync(cancellationToken);

        // Enqueued for the background service — the response must not wait on SMTP.
        emailQueue.Enqueue(entity);

        return Results.Created($"/api/contact/{entity.Id}", new { entity.Id });
    })
    .WithName("SubmitContact");

app.Run();
