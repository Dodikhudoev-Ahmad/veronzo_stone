namespace VeronzoApi.Models.Auth;

public record AuthResponse(string AccessToken, DateTime AccessTokenExpiresAtUtc, AdminUserResponse Admin);
