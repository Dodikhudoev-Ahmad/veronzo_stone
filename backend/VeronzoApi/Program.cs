using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
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

builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection(SmtpOptions.SectionName));
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();

builder.Services.AddValidatorsFromAssemblyContaining<ContactRequestValidator>();

builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicyName, policy =>
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
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

app.UseCors(CorsPolicyName);

app.MapPost("/api/contact", async (
        ContactRequestDto dto,
        IValidator<ContactRequestDto> validator,
        AppDbContext db,
        IEmailSender emailSender,
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

        await emailSender.SendContactNotificationAsync(entity, cancellationToken);

        return Results.Created($"/api/contact/{entity.Id}", new { entity.Id });
    })
    .WithName("SubmitContact");

app.Run();
