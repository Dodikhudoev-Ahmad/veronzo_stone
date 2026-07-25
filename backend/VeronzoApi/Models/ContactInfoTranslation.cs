namespace VeronzoApi.Models;

// Only Label is translated — ContactInfo.Value holds phone numbers, email
// addresses, and a physical address interchangeably with no field to tell
// them apart, and phone/email are explicitly not translatable content.
public class ContactInfoTranslation
{
    public int Id { get; set; }
    public int ContactInfoId { get; set; }
    public ContactInfo? ContactInfo { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
}
