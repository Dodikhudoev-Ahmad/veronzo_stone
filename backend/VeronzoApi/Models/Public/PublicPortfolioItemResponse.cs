namespace VeronzoApi.Models.Public;

// IsFeatured is kept (unlike IsVisible) — it's real content the public site uses
// to decide which card renders large, not an admin-only management flag.
public record PublicPortfolioItemResponse(
    int Id, string Title, string? Meta, string? CategoryTag, string? ImageUrl, int SortOrder, bool IsFeatured);
