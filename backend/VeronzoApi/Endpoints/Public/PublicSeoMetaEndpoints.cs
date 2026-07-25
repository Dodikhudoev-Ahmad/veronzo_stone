using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;
using VeronzoApi.Models.Public;

namespace VeronzoApi.Endpoints.Public;

public static class PublicSeoMetaEndpoints
{
    public static void MapPublicSeoMetaEndpoints(this WebApplication app)
    {
        // Single-resource lookup by PageKey rather than a full list — PageKey is
        // already unique-indexed, and a page only ever needs its own SEO metadata,
        // never every page's at once (see final report for the reasoning).
        app.MapGet("/api/public/seo-meta/{pageKey}", GetByPageKeyAsync)
            .WithSummary("Get SEO metadata for a page")
            .WithDescription(
                "Public, unauthenticated. Looks up by PageKey (e.g. \"home\"). Optional ?lang= " +
                "(ru/tg/en/zh, default ru) with ru-then-legacy-field fallback for Title/Description. " +
                "OgImageUrl is a URL and never varies by language.")
            .Produces<PublicSeoMetaResponse>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound);
    }

    private static async Task<IResult> GetByPageKeyAsync(
        string pageKey, string? lang, AppDbContext db, CancellationToken cancellationToken)
    {
        var language = SupportedLanguages.Normalize(lang);

        var raw = await db.SeoMetas
            .AsNoTracking()
            .Where(s => s.PageKey == pageKey)
            .Select(s => new
            {
                s.PageKey,
                s.Title,
                s.Description,
                s.OgImageUrl,
                Requested = s.Translations.FirstOrDefault(t => t.LanguageCode == language),
                Ru = s.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (raw is null)
        {
            return Results.NotFound(new ApiErrorResponse("SEO metadata not found for this page"));
        }

        var item = new PublicSeoMetaResponse(
            raw.PageKey,
            PublicTranslationHelpers.Pick(raw.Requested?.Title, raw.Ru?.Title, raw.Title),
            PublicTranslationHelpers.PickNullable(raw.Requested?.Description, raw.Ru?.Description, raw.Description),
            raw.OgImageUrl);

        return Results.Ok(item);
    }
}
