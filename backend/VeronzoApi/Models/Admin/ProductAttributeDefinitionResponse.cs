namespace VeronzoApi.Models.Admin;

public record ProductAttributeDefinitionResponse(
    int Id, int CategoryId, string Key, string Name, int SortOrder, bool IsFilterable, bool IsVisible);
