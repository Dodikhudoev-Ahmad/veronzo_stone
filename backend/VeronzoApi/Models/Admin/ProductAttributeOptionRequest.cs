namespace VeronzoApi.Models.Admin;

public record ProductAttributeOptionRequest(
    int DefinitionId, string Value, string Label, int SortOrder, bool IsVisible);
