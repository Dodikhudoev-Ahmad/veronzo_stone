using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Public;

namespace VeronzoApi.Endpoints.Public;

public static class PublicHeroStatEndpoints
{
    public static void MapPublicHeroStatEndpoints(this WebApplication app)
    {
        app.MapGet("/api/public/hero-stats", ListAsync)
            .WithSummary("List visible hero stats")
            .WithDescription(
                "Public, unauthenticated. Only IsVisible=true stats, ordered by SortOrder then Id. " +
                "Optional ?lang= (ru/tg/en/zh, default ru), else falls back to the Accept-Language header, " +
                "with ru-then-legacy-field fallback for Label. Value/Suffix are numeric/symbolic and never " +
                "vary by language.")
            .Produces<PublicHeroStatResponse[]>(StatusCodes.Status200OK)
            .CacheOutput("PublicContent");
    }

    private static async Task<IResult> ListAsync(
        string? lang, AppDbContext db, HttpContext httpContext, CancellationToken cancellationToken)
    {
        var language = PublicTranslationHelpers.ResolveLanguage(lang, httpContext);

        var raw = await db.HeroStats
            .AsNoTracking()
            .Where(h => h.IsVisible)
            .OrderBy(h => h.SortOrder).ThenBy(h => h.Id)
            .Select(h => new
            {
                h.Id,
                h.Label,
                h.Value,
                h.Suffix,
                h.SortOrder,
                Requested = h.Translations.FirstOrDefault(t => t.LanguageCode == language),
                Ru = h.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default)
            })
            .ToListAsync(cancellationToken);

        var items = raw.Select(x => new PublicHeroStatResponse(
            x.Id, PublicTranslationHelpers.Pick(x.Requested?.Label, x.Ru?.Label, x.Label), x.Value, x.Suffix, x.SortOrder));

        return Results.Ok(items);
    }
}
