namespace VeronzoApi.Models.Admin;

public record ProductAttributeValueResponse(
    int Id, int ProductId, int DefinitionId, int? OptionId, string? TextValue);
