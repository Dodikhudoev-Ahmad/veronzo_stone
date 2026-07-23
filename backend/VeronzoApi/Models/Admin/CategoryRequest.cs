namespace VeronzoApi.Models.Admin;

public record CategoryRequest(string Slug, string Name, int SortOrder, bool IsVisible);
