namespace VeronzoApi.Models;

public class AdminUser
{
    public int Id { get; set; }
    // Display value, kept in whatever casing the admin was created with.
    public string Email { get; set; } = string.Empty;
    // Email.Trim().ToUpperInvariant() — the actual uniqueness/lookup key, since a
    // plain unique index on Email is case-sensitive on SQLite (and not guaranteed
    // case-insensitive on every future production database either).
    public string NormalizedEmail { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Admin";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
