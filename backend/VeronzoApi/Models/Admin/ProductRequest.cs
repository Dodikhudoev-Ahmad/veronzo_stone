namespace VeronzoApi.Models.Admin;

public record ProductRequest(
    int CategoryId, string Title, string? Description, string? BadgeText, string? ImageUrl, int SortOrder, bool IsVisible);
