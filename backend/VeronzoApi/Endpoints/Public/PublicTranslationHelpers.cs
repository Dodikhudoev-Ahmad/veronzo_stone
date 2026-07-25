namespace VeronzoApi.Endpoints.Public;

// Shared fallback logic for every public endpoint that serves translatable
// content: 1) the requested language, 2) the ru translation, 3) the legacy
// field on the entity itself, 4) empty/null per the response DTO's shape.
internal static class PublicTranslationHelpers
{
    public static string Pick(string? requested, string? ru, string fallback) =>
        !string.IsNullOrWhiteSpace(requested) ? requested :
        !string.IsNullOrWhiteSpace(ru) ? ru :
        fallback;

    public static string? PickNullable(string? requested, string? ru, string? fallback) =>
        !string.IsNullOrWhiteSpace(requested) ? requested :
        !string.IsNullOrWhiteSpace(ru) ? ru :
        fallback;
}
