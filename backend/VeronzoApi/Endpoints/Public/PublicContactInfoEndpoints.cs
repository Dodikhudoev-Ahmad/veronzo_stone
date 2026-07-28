using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Public;

namespace VeronzoApi.Endpoints.Public;

public static class PublicContactInfoEndpoints
{
    public static void MapPublicContactInfoEndpoints(this WebApplication app)
    {
        app.MapGet("/api/public/contact-info", ListAsync)
            .WithSummary("List contact info entries")
            .WithDescription(
                "Public, unauthenticated. ContactInfo has no IsVisible flag — every entry (showroom, " +
                "phone, email) is public by design, so all rows are returned, ordered by SortOrder then Id. " +
                "Optional ?lang= (ru/tg/en/zh, default ru), else falls back to the Accept-Language header, " +
                "with ru-then-legacy-field fallback for Label only — Value holds phone/email/address text " +
                "and is never translated.")
            .Produces<PublicContactInfoResponse[]>(StatusCodes.Status200OK)
            .CacheOutput("PublicContent");
    }

    private static async Task<IResult> ListAsync(
        string? lang, AppDbContext db, HttpContext httpContext, CancellationToken cancellationToken)
    {
        var language = PublicTranslationHelpers.ResolveLanguage(lang, httpContext);

        var raw = await db.ContactInfos
            .AsNoTracking()
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Id)
            .Select(c => new
            {
                c.Label,
                c.Value,
                Requested = c.Translations.FirstOrDefault(t => t.LanguageCode == language),
                Ru = c.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default)
            })
            .ToListAsync(cancellationToken);

        var items = raw.Select(x => new PublicContactInfoResponse(
            PublicTranslationHelpers.Pick(x.Requested?.Label, x.Ru?.Label, x.Label), x.Value));

        return Results.Ok(items);
    }
}
