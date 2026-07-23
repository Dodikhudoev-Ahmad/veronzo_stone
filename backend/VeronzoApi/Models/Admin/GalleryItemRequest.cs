namespace VeronzoApi.Models.Admin;

public record GalleryItemRequest(string Title, string? ImageUrl, int SortOrder, bool IsVisible);
