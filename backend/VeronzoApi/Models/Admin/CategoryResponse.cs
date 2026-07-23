namespace VeronzoApi.Models.Admin;

public record CategoryResponse(int Id, string Slug, string Name, int SortOrder, bool IsVisible);
