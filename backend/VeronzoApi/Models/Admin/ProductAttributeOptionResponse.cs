namespace VeronzoApi.Models.Admin;

public record ProductAttributeOptionResponse(
    int Id, int DefinitionId, string Value, string Label, int SortOrder, bool IsVisible);
