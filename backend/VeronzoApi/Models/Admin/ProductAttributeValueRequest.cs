namespace VeronzoApi.Models.Admin;

public record ProductAttributeValueRequest(
    int ProductId, int DefinitionId, int? OptionId, string? TextValue);
