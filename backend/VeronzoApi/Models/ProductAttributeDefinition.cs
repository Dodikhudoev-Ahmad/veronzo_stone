namespace VeronzoApi.Models;

public class ProductAttributeDefinition
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    // Stable slug used as the public filter query-param key (e.g. "stone_type").
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsFilterable { get; set; }
    public bool IsVisible { get; set; } = true;
    public ICollection<ProductAttributeOption> Options { get; set; } = new List<ProductAttributeOption>();
    public ICollection<ProductAttributeValue> Values { get; set; } = new List<ProductAttributeValue>();
    public ICollection<ProductAttributeDefinitionTranslation> Translations { get; set; } = new List<ProductAttributeDefinitionTranslation>();
}
