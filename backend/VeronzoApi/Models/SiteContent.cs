namespace VeronzoApi.Models;

public class SiteContent
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public ICollection<SiteContentTranslation> Translations { get; set; } = new List<SiteContentTranslation>();
}
