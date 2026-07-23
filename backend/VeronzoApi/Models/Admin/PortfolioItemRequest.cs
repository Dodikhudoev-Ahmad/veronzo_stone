namespace VeronzoApi.Models.Admin;

public record PortfolioItemRequest(
    string Title, string? Meta, string? CategoryTag, string? ImageUrl, int SortOrder, bool IsVisible, bool IsFeatured);
