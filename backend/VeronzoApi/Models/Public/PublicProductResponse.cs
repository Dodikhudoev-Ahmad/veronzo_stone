namespace VeronzoApi.Models.Public;

public record PublicProductResponse(
    int Id, int CategoryId, string Title, string? Description, string? BadgeText, string? ImageUrl, int SortOrder);
