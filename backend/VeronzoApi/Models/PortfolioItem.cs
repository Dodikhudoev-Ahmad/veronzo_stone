namespace VeronzoApi.Models;

public class PortfolioItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Meta { get; set; }
    public string? CategoryTag { get; set; }
    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsVisible { get; set; } = true;
    public bool IsFeatured { get; set; }
}
