namespace VeronzoApi.Models.Admin;

public record GalleryItemResponse(int Id, string Title, string? ImageUrl, int SortOrder, bool IsVisible);
