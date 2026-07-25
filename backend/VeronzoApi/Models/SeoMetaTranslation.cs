namespace VeronzoApi.Models;

public class SeoMetaTranslation
{
    public int Id { get; set; }
    public int SeoMetaId { get; set; }
    public SeoMeta? SeoMeta { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    // Keywords/OgTitle/OgDescription have no equivalent column on SeoMeta
    // itself — new, translation-only fields with no legacy fallback source.
    public string? Keywords { get; set; }
    public string? OgTitle { get; set; }
    public string? OgDescription { get; set; }
}
