namespace VeronzoApi.Models.Admin;

// Fields is intentionally a loose string/string? bag rather than a typed shape
// per entity — this endpoint serves all 8 translatable entities through one
// route, and each has a different field set (see AdminTranslationEndpoints).
public record TranslationResponse(string LanguageCode, Dictionary<string, string?> Fields);
