namespace VeronzoApi.Models;

public class HeroStatTranslation
{
    public int Id { get; set; }
    public int HeroStatId { get; set; }
    public HeroStat? HeroStat { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
}
