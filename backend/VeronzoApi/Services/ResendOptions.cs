namespace VeronzoApi.Services;

public class ResendOptions
{
    public const string SectionName = "Resend";

    public string ApiKey { get; set; } = string.Empty;
    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = "Veronzo";
    public string NotifyToAddress { get; set; } = string.Empty;
}
