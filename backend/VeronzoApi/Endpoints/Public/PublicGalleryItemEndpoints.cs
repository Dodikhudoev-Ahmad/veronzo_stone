using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Public;

namespace VeronzoApi.Endpoints.Public;

public static class PublicGalleryItemEndpoints
{
    public static void MapPublicGalleryItemEndpoints(this WebApplication app)
    {
        app.MapGet("/api/public/gallery-items", ListAsync)
            .WithSummary("List visible gallery items")
            .WithDescription(
                "Public, unauthenticated. Only IsVisible=true items, ordered by SortOrder then Id. " +
                "Optional ?lang= (ru/tg/en/fa, default ru), else falls back to the Accept-Language header, " +
                "with ru-then-legacy-field fallback for Title.")
            .Produces<PublicGalleryItemResponse[]>(StatusCodes.Status200OK)
            .CacheOutput("PublicContent");
    }

    private static async Task<IResult> ListAsync(
        string? lang, AppDbContext db, HttpContext httpContext, CancellationToken cancellationToken)
    {
        var language = PublicTranslationHelpers.ResolveLanguage(lang, httpContext);

        var raw = await db.GalleryItems
            .AsNoTracking()
            .Where(g => g.IsVisible)
            .OrderBy(g => g.SortOrder).ThenBy(g => g.Id)
            .Select(g => new
            {
                g.Id,
                g.Title,
                g.ImageUrl,
                g.SortOrder,
                Requested = g.Translations.FirstOrDefault(t => t.LanguageCode == language),
                Ru = g.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default)
            })
            .ToListAsync(cancellationToken);

        var items = raw.Select(x => new PublicGalleryItemResponse(
            x.Id, PublicTranslationHelpers.Pick(x.Requested?.Title, x.Ru?.Title, x.Title), x.ImageUrl, x.SortOrder));

        return Results.Ok(items);
    }
}
