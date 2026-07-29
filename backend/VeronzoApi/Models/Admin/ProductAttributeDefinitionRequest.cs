namespace VeronzoApi.Models.Admin;

public record ProductAttributeDefinitionRequest(
    int CategoryId, string Key, string Name, int SortOrder, bool IsFilterable, bool IsVisible);
