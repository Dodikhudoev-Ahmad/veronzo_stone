namespace VeronzoApi.Models.Public;

// Deliberately narrower than Models/Admin/CategoryResponse.cs — IsVisible is an
// admin-management flag with no meaning once the endpoint has already filtered to
// visible-only rows, so it's left out of the public contract entirely.
public record PublicCategoryResponse(int Id, string Slug, string Name, int SortOrder);
