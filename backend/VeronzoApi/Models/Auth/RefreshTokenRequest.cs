namespace VeronzoApi.Models.Auth;

// The refresh token is normally read from the HttpOnly "refreshToken" cookie set at
// login/refresh time. This body field exists only as a fallback for non-browser
// clients that cannot rely on cookies — it never widens what a browser-based XSS
// attacker could exfiltrate, since the cookie itself stays inaccessible to JS.
public record RefreshTokenRequest(string? RefreshToken);
