namespace VeronzoApi.Models.Admin;

public record PortfolioItemResponse(
    int Id, string Title, string? Meta, string? CategoryTag, string? ImageUrl, int SortOrder, bool IsVisible, bool IsFeatured);
