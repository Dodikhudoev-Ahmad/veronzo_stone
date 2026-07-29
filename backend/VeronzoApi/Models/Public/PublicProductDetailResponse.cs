namespace VeronzoApi.Models.Public;

public record PublicProductDetailResponse(
    int Id,
    int CategoryId,
    string CategorySlug,
    string Title,
    string? Description,
    string? BadgeText,
    int SortOrder,
    PublicProductImageResponse[] Images,
    PublicProductDetailAttributeResponse[] Attributes);
