namespace VeronzoApi.Models.Admin;

public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalItems, int TotalPages);
