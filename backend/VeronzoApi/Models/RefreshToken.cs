namespace VeronzoApi.Models;

public class RefreshToken
{
    public int Id { get; set; }
    public int AdminUserId { get; set; }
    public AdminUser? AdminUser { get; set; }
    // Only the SHA-256 hash of the token is ever stored — the raw value exists
    // solely in the HttpOnly cookie handed to the client.
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RevokedAt { get; set; }
}
