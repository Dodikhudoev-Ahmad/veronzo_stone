namespace VeronzoApi.Models;

public class ProductAttributeOptionTranslation
{
    public int Id { get; set; }
    public int ProductAttributeOptionId { get; set; }
    public ProductAttributeOption? ProductAttributeOption { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
}
