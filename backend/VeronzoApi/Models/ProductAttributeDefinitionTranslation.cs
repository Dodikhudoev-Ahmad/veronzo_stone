namespace VeronzoApi.Models;

public class ProductAttributeDefinitionTranslation
{
    public int Id { get; set; }
    public int ProductAttributeDefinitionId { get; set; }
    public ProductAttributeDefinition? ProductAttributeDefinition { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}
