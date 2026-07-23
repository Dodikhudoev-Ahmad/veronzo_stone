namespace VeronzoApi.Models;

public class HeroStat
{
    public int Id { get; set; }
    public int Value { get; set; }
    public string? Suffix { get; set; }
    public string Label { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
