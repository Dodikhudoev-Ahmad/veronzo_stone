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
                "Optional ?lang= (ru/tg/en/zh, default ru) with ru-then-legacy-field fallback for Title.")
            .Produces<PublicGalleryItemResponse[]>(StatusCodes.Status200OK);
    }

    private static async Task<IResult> ListAsync(string? lang, AppDbContext db, CancellationToken cancellationToken)
    {
        var language = SupportedLanguages.Normalize(lang);

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
