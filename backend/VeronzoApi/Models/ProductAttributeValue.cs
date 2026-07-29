namespace VeronzoApi.Models;

public class ProductAttributeValue
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public int DefinitionId { get; set; }
    public ProductAttributeDefinition? Definition { get; set; }
    public int? OptionId { get; set; }
    public ProductAttributeOption? Option { get; set; }
    public string? TextValue { get; set; }
}
