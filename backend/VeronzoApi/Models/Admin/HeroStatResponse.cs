namespace VeronzoApi.Models.Admin;

public record HeroStatResponse(int Id, string Label, int Value, string? Suffix, int SortOrder, bool IsVisible);
