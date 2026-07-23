namespace VeronzoApi.Models.Admin;

public record ProductResponse(
    int Id, int CategoryId, string Title, string? Description, string? BadgeText, string? ImageUrl, int SortOrder, bool IsVisible);
