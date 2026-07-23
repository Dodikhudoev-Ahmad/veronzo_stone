namespace VeronzoApi.Models;

public class SeoMeta
{
    public int Id { get; set; }
    public string PageKey { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? OgImageUrl { get; set; }
}
