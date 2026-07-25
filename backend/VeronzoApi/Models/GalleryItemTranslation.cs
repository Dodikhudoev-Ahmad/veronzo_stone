namespace VeronzoApi.Models;

public class GalleryItemTranslation
{
    public int Id { get; set; }
    public int GalleryItemId { get; set; }
    public GalleryItem? GalleryItem { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    // No equivalent column on GalleryItem itself — this is a new,
    // translation-only field, so it has no legacy fallback source.
    public string? AltText { get; set; }
}
