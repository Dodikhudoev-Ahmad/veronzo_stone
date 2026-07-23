namespace VeronzoApi.Services;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "veronzo-api";
    public string Audience { get; set; } = "veronzo-admin";
    // Never defaulted here — Program.cs enforces that a real secret is present
    // (and long enough) before the app is allowed to start in Production.
    public string Secret { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 30;
}
