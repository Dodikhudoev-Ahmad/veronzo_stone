namespace VeronzoApi.Models;

public class PortfolioItemTranslation
{
    public int Id { get; set; }
    public int PortfolioItemId { get; set; }
    public PortfolioItem? PortfolioItem { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Meta { get; set; }
    public string? CategoryTag { get; set; }
}
