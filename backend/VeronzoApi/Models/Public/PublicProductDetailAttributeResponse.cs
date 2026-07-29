namespace VeronzoApi.Models.Public;

// Resolved for display: Name/Value are already translated (requested-lang ->
// ru -> legacy fallback, see PublicTranslationHelpers) -- Key is included only
// as a stable identifier for React list keys, never rendered as UI text.
public record PublicProductDetailAttributeResponse(string Key, string Name, string Value);
