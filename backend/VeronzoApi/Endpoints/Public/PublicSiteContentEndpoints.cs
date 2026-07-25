using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Public;

namespace VeronzoApi.Endpoints.Public;

public static class PublicSiteContentEndpoints
{
    public static void MapPublicSiteContentEndpoints(this WebApplication app)
    {
        app.MapGet("/api/public/site-content", ListAsync)
            .WithSummary("List all site content entries")
            .WithDescription(
                "Public, unauthenticated. SiteContent has no IsVisible flag — every key/value pair is " +
                "public text content by design (hero copy, about/why/contacts text, footer tagline), " +
                "so all rows are returned, ordered by Key for a predictable/stable response. Optional " +
                "?lang= (ru/tg/en/zh, default ru) with ru-then-legacy-field fallback for Value.")
            .Produces<PublicSiteContentResponse[]>(StatusCodes.Status200OK);
    }

    private static async Task<IResult> ListAsync(string? lang, AppDbContext db, CancellationToken cancellationToken)
    {
        var language = SupportedLanguages.Normalize(lang);

        var raw = await db.SiteContents
            .AsNoTracking()
            .OrderBy(c => c.Key)
            .Select(c => new
            {
                c.Key,
                c.Value,
                Requested = c.Translations.FirstOrDefault(t => t.LanguageCode == language),
                Ru = c.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default)
            })
            .ToListAsync(cancellationToken);

        var items = raw.Select(x => new PublicSiteContentResponse(
            x.Key, PublicTranslationHelpers.Pick(x.Requested?.Value, x.Ru?.Value, x.Value)));

        return Results.Ok(items);
    }
}
