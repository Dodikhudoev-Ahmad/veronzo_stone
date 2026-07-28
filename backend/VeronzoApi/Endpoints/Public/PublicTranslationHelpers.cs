using Microsoft.Net.Http.Headers;
using VeronzoApi.Models;

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

    // ?lang= takes precedence when present and supported; otherwise falls back to
    // the Accept-Language header (highest-quality supported tag, matched on the
    // primary subtag so "en-US" matches "en"); otherwise ru. Never throws on a
    // malformed header — an unparseable value just falls through to ru.
    public static string ResolveLanguage(string? queryLang, HttpContext context)
    {
        if (SupportedLanguages.IsSupported(queryLang))
        {
            return SupportedLanguages.Normalize(queryLang);
        }

        var header = context.Request.Headers.AcceptLanguage;
        if (header.Count > 0 && StringWithQualityHeaderValue.TryParseList(header, out var values))
        {
            foreach (var value in values.OrderByDescending(v => v.Quality ?? 1))
            {
                var tag = value.Value.Value?.Split('-')[0];
                if (SupportedLanguages.IsSupported(tag))
                {
                    return SupportedLanguages.Normalize(tag);
                }
            }
        }

        return SupportedLanguages.Default;
    }
}
