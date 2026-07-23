namespace VeronzoApi.Models;

public class Product
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public Category? Category { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    // Short call-to-action label shown on the catalog card (e.g. "60+ ВИДОВ В НАЛИЧИИ →").
    public string? BadgeText { get; set; }
    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsVisible { get; set; } = true;
}
