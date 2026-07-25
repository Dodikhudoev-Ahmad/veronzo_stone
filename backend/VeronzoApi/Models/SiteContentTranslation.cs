namespace VeronzoApi.Models;

public class SiteContentTranslation
{
    public int Id { get; set; }
    public int SiteContentId { get; set; }
    public SiteContent? SiteContent { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}
