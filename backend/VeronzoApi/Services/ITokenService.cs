using VeronzoApi.Models;

namespace VeronzoApi.Services;

public interface ITokenService
{
    (string AccessToken, DateTime ExpiresAtUtc) CreateAccessToken(AdminUser admin);
    string GenerateRefreshTokenValue();
    string HashRefreshToken(string rawToken);
    DateTime GetRefreshTokenExpiry();
}
