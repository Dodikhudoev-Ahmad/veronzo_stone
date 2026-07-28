using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Auth;
using VeronzoApi.Services;

namespace VeronzoApi.Endpoints;

public static class AuthEndpoints
{
    private const string RefreshCookieName = "refreshToken";
    private const string CsrfHeaderName = "X-CSRF-Token";

    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/login", LoginAsync).RequireRateLimiting("auth");
        group.MapPost("/refresh", RefreshAsync).RequireRateLimiting("auth");
        group.MapPost("/logout", LogoutAsync);
        group.MapGet("/me", MeAsync).RequireAuthorization(policy => policy.RequireRole("Admin"));
    }

    private static async Task<IResult> LoginAsync(
        LoginRequest request,
        AppDbContext db,
        IPasswordHasher<AdminUser> passwordHasher,
        ITokenService tokenService,
        HttpContext httpContext,
        IWebHostEnvironment env,
        ILogger<Program> logger,
        CancellationToken cancellationToken)
    {
        var submittedEmail = request.Email.Trim();
        var normalizedEmail = submittedEmail.ToUpperInvariant();
        var admin = await db.AdminUsers.FirstOrDefaultAsync(a => a.NormalizedEmail == normalizedEmail, cancellationToken);

        // Same generic outcome whether the email doesn't exist, the account is
        // disabled, or the password is wrong — never reveal which case applied.
        var invalid = admin is null || !admin.IsActive;
        if (!invalid)
        {
            var verification = passwordHasher.VerifyHashedPassword(admin!, admin!.PasswordHash, request.Password);
            invalid = verification == PasswordVerificationResult.Failed;
        }

        if (invalid)
        {
            logger.LogWarning("Failed admin login attempt for {Email} from {Ip}",
                submittedEmail, httpContext.Connection.RemoteIpAddress);
            return Results.Json(new { error = "Invalid email or password" }, statusCode: StatusCodes.Status401Unauthorized);
        }

        var (accessToken, accessExpiresAt) = tokenService.CreateAccessToken(admin!);
        await IssueRefreshTokenAsync(db, tokenService, admin!.Id, httpContext, env, cancellationToken);

        return Results.Ok(new AuthResponse(accessToken, accessExpiresAt,
            new AdminUserResponse(admin.Id, admin.Email, admin.Role)));
    }

    private static async Task<IResult> RefreshAsync(
        HttpContext httpContext,
        AppDbContext db,
        ITokenService tokenService,
        IWebHostEnvironment env,
        ILogger<Program> logger,
        CancellationToken cancellationToken,
        RefreshTokenRequest? body = null)
    {
        var cookieToken = httpContext.Request.Cookies[RefreshCookieName];
        var usingCookieFlow = !string.IsNullOrWhiteSpace(cookieToken);

        if (usingCookieFlow && !HasCsrfHeader(httpContext))
        {
            return Results.Json(new { error = "Missing X-CSRF-Token header" }, statusCode: StatusCodes.Status403Forbidden);
        }

        var rawToken = usingCookieFlow ? cookieToken : body?.RefreshToken;

        if (string.IsNullOrWhiteSpace(rawToken))
        {
            return Results.Json(new { error = "Refresh token is missing" }, statusCode: StatusCodes.Status401Unauthorized);
        }

        var tokenHash = tokenService.HashRefreshToken(rawToken);

        // Read-only snapshot first — AsNoTracking so it can't interfere with the
        // atomic conditional UPDATE below (which talks to the database directly,
        // bypassing the change tracker).
        var existing = await db.RefreshTokens
            .AsNoTracking()
            .Include(r => r.AdminUser)
            .FirstOrDefaultAsync(r => r.TokenHash == tokenHash, cancellationToken);

        if (existing is null)
        {
            return Results.Json(new { error = "Invalid refresh token" }, statusCode: StatusCodes.Status401Unauthorized);
        }

        if (existing.RevokedAt is not null)
        {
            // Already revoked *before* this request even started — a genuine reuse
            // of a dead token, not a same-instant race with a legitimate refresh.
            // Treat as possible theft and revoke every other active session.
            var allActive = await db.RefreshTokens
                .Where(r => r.AdminUserId == existing.AdminUserId && r.RevokedAt == null)
                .ToListAsync(cancellationToken);
            foreach (var token in allActive)
            {
                token.RevokedAt = DateTime.UtcNow;
            }
            await db.SaveChangesAsync(cancellationToken);

            logger.LogWarning(
                "Refresh token reuse detected for AdminUserId {AdminUserId} — all active sessions revoked",
                existing.AdminUserId);

            ClearRefreshCookie(httpContext, env);
            return Results.Json(new { error = "Invalid refresh token" }, statusCode: StatusCodes.Status401Unauthorized);
        }

        if (existing.ExpiresAt < DateTime.UtcNow)
        {
            return Results.Json(new { error = "Refresh token expired" }, statusCode: StatusCodes.Status401Unauthorized);
        }

        if (existing.AdminUser is null || !existing.AdminUser.IsActive)
        {
            return Results.Json(new { error = "Invalid refresh token" }, statusCode: StatusCodes.Status401Unauthorized);
        }

        // Atomic claim: a single conditional UPDATE (WHERE Id = ... AND RevokedAt IS
        // NULL) executed directly against the database, not via the change tracker.
        // If two requests race on the same token, the database guarantees only one
        // UPDATE can match the still-null row — the other affects zero rows. This
        // works identically on SQLite today and any future RDBMS (Postgres etc.),
        // since it relies on ordinary per-row UPDATE atomicity rather than anything
        // SQLite-specific.
        var rowsClaimed = await db.RefreshTokens
            .Where(r => r.Id == existing.Id && r.RevokedAt == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(r => r.RevokedAt, DateTime.UtcNow), cancellationToken);

        if (rowsClaimed == 0)
        {
            // Lost the race to a concurrent refresh call using the same token
            // (e.g. two tabs firing at once). Not proven theft — the winner's
            // brand-new session must NOT be revoked here, so this is a plain 401
            // with no reuse-detection cascade.
            return Results.Json(new { error = "Refresh token already used" }, statusCode: StatusCodes.Status401Unauthorized);
        }

        var (accessToken, accessExpiresAt) = tokenService.CreateAccessToken(existing.AdminUser);
        await IssueRefreshTokenAsync(db, tokenService, existing.AdminUserId, httpContext, env, cancellationToken);

        return Results.Ok(new AuthResponse(accessToken, accessExpiresAt,
            new AdminUserResponse(existing.AdminUser.Id, existing.AdminUser.Email, existing.AdminUser.Role)));
    }

    private static async Task<IResult> LogoutAsync(
        HttpContext httpContext,
        AppDbContext db,
        ITokenService tokenService,
        IWebHostEnvironment env,
        CancellationToken cancellationToken,
        RefreshTokenRequest? body = null)
    {
        var cookieToken = httpContext.Request.Cookies[RefreshCookieName];
        var usingCookieFlow = !string.IsNullOrWhiteSpace(cookieToken);

        if (usingCookieFlow && !HasCsrfHeader(httpContext))
        {
            return Results.Json(new { error = "Missing X-CSRF-Token header" }, statusCode: StatusCodes.Status403Forbidden);
        }

        var rawToken = usingCookieFlow ? cookieToken : body?.RefreshToken;

        if (!string.IsNullOrWhiteSpace(rawToken))
        {
            var tokenHash = tokenService.HashRefreshToken(rawToken);
            var existing = await db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == tokenHash, cancellationToken);
            if (existing is not null && existing.RevokedAt is null)
            {
                existing.RevokedAt = DateTime.UtcNow;
                await db.SaveChangesAsync(cancellationToken);
            }
        }

        ClearRefreshCookie(httpContext, env);
        return Results.NoContent();
    }

    private static async Task<IResult> MeAsync(ClaimsPrincipal user, AppDbContext db, CancellationToken cancellationToken)
    {
        var idClaim = user.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idClaim, out var adminId))
        {
            return Results.Unauthorized();
        }

        // Re-checked against the database (not just the token claims) so a
        // deactivated admin loses access before their access token naturally expires.
        var admin = await db.AdminUsers.FirstOrDefaultAsync(a => a.Id == adminId && a.IsActive, cancellationToken);
        if (admin is null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(new AdminUserResponse(admin.Id, admin.Email, admin.Role));
    }

    // Minimal CSRF defense for the cookie-based refresh flow: a custom header forces
    // the browser to send a CORS preflight, and only an origin explicitly listed in
    // the CORS policy is allowed to have that preflight (and thus the real request)
    // succeed. The header's value is not a secret — its mere presence, gated by CORS,
    // is what a same-site attacker page cannot forge.
    private static bool HasCsrfHeader(HttpContext httpContext) =>
        httpContext.Request.Headers.TryGetValue(CsrfHeaderName, out var values)
        && values.Count > 0
        && !string.IsNullOrWhiteSpace(values[0]);

    private static async Task IssueRefreshTokenAsync(
        AppDbContext db, ITokenService tokenService, int adminUserId,
        HttpContext httpContext, IWebHostEnvironment env, CancellationToken cancellationToken)
    {
        var rawToken = tokenService.GenerateRefreshTokenValue();
        var entity = new RefreshToken
        {
            AdminUserId = adminUserId,
            TokenHash = tokenService.HashRefreshToken(rawToken),
            ExpiresAt = tokenService.GetRefreshTokenExpiry()
        };
        db.RefreshTokens.Add(entity);
        await db.SaveChangesAsync(cancellationToken);

        httpContext.Response.Cookies.Append(RefreshCookieName, rawToken, BuildCookieOptions(env, entity.ExpiresAt));
    }

    private static void ClearRefreshCookie(HttpContext httpContext, IWebHostEnvironment env)
    {
        httpContext.Response.Cookies.Append(RefreshCookieName, string.Empty,
            BuildCookieOptions(env, DateTimeOffset.UnixEpoch));
    }

    // Secure+SameSite=None is required for the real cross-site Netlify↔Railway setup,
    // but SameSite=None without Secure is rejected by browsers outright — so both are
    // relaxed together in Development to keep local `dotnet run` over plain HTTP usable.
    private static CookieOptions BuildCookieOptions(IWebHostEnvironment env, DateTimeOffset expires)
    {
        var isProd = !env.IsDevelopment();
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = isProd,
            SameSite = isProd ? SameSiteMode.None : SameSiteMode.Lax,
            Expires = expires,
            Path = "/api/auth"
        };
    }
}
