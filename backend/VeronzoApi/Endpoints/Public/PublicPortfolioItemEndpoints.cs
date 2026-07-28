using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Public;

namespace VeronzoApi.Endpoints.Public;

public static class PublicPortfolioItemEndpoints
{
    public static void MapPublicPortfolioItemEndpoints(this WebApplication app)
    {
        app.MapGet("/api/public/portfolio-items", ListAsync)
            .WithSummary("List visible portfolio items")
            .WithDescription(
                "Public, unauthenticated. Only IsVisible=true items, ordered by SortOrder then Id. " +
                "Optional ?lang= (ru/tg/en/zh, default ru), else falls back to the Accept-Language header, " +
                "with ru-then-legacy-field fallback.")
            .Produces<PublicPortfolioItemResponse[]>(StatusCodes.Status200OK)
            .CacheOutput("PublicContent");
    }

    private static async Task<IResult> ListAsync(
        string? lang, AppDbContext db, HttpContext httpContext, CancellationToken cancellationToken)
    {
        var language = PublicTranslationHelpers.ResolveLanguage(lang, httpContext);

        var raw = await db.PortfolioItems
            .AsNoTracking()
            .Where(p => p.IsVisible)
            .OrderBy(p => p.SortOrder).ThenBy(p => p.Id)
            .Select(p => new
            {
                p.Id,
                p.Title,
                p.Meta,
                p.CategoryTag,
                p.ImageUrl,
                p.SortOrder,
                p.IsFeatured,
                Requested = p.Translations.FirstOrDefault(t => t.LanguageCode == language),
                Ru = p.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default)
            })
            .ToListAsync(cancellationToken);

        var items = raw.Select(x => new PublicPortfolioItemResponse(
            x.Id,
            PublicTranslationHelpers.Pick(x.Requested?.Title, x.Ru?.Title, x.Title),
            PublicTranslationHelpers.PickNullable(x.Requested?.Meta, x.Ru?.Meta, x.Meta),
            PublicTranslationHelpers.PickNullable(x.Requested?.CategoryTag, x.Ru?.CategoryTag, x.CategoryTag),
            x.ImageUrl, x.SortOrder, x.IsFeatured));

        return Results.Ok(items);
    }
}
