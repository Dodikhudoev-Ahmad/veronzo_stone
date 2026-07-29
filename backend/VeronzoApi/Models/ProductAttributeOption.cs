namespace VeronzoApi.Models;

public class ProductAttributeOption
{
    public int Id { get; set; }
    public int DefinitionId { get; set; }
    public ProductAttributeDefinition? Definition { get; set; }
    // Stable slug used as the public filter query-param value (e.g. "marble").
    public string Value { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsVisible { get; set; } = true;
    public ICollection<ProductAttributeOptionTranslation> Translations { get; set; } = new List<ProductAttributeOptionTranslation>();
}
