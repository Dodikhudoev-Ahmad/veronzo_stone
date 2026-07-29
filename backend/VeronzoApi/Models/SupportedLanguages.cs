namespace VeronzoApi.Models;

// Single source of truth for supported language codes — every place that
// needs to validate, normalize, or enumerate languages goes through here
// instead of hardcoding its own copy of the list.
public static class SupportedLanguages
{
    public const string Default = "ru";

    public static readonly IReadOnlyList<string> All = ["ru", "tg", "en", "fa"];

    public static bool IsSupported(string? languageCode) =>
        !string.IsNullOrWhiteSpace(languageCode) && All.Contains(languageCode.Trim().ToLowerInvariant());

    // Never throws and never 500s on an unrecognized code — an unknown or
    // missing language silently falls back to the default rather than
    // failing the request.
    public static string Normalize(string? languageCode)
    {
        if (string.IsNullOrWhiteSpace(languageCode))
        {
            return Default;
        }

        var normalized = languageCode.Trim().ToLowerInvariant();
        return All.Contains(normalized) ? normalized : Default;
    }
}
