using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Public;

namespace VeronzoApi.Endpoints.Public;

public static class PublicCategoryEndpoints
{
    public static void MapPublicCategoryEndpoints(this WebApplication app)
    {
        app.MapGet("/api/public/categories", ListAsync)
            .WithSummary("List visible categories")
            .WithDescription(
                "Public, unauthenticated. Only IsVisible=true categories, ordered by SortOrder then Id. " +
                "Optional ?lang= (ru/tg/en/zh, default ru); an unknown/missing value falls back to ru, " +
                "and a category with no translation for the requested language falls back to its ru " +
                "translation, then to its legacy Name field.")
            .Produces<PublicCategoryResponse[]>(StatusCodes.Status200OK);
    }

    private static async Task<IResult> ListAsync(string? lang, AppDbContext db, CancellationToken cancellationToken)
    {
        var language = SupportedLanguages.Normalize(lang);

        var raw = await db.Categories
            .AsNoTracking()
            .Where(c => c.IsVisible)
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Id)
            .Select(c => new
            {
                c.Id,
                c.Slug,
                c.Name,
                c.SortOrder,
                Requested = c.Translations.FirstOrDefault(t => t.LanguageCode == language),
                Ru = c.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default)
            })
            .ToListAsync(cancellationToken);

        var items = raw.Select(x => new PublicCategoryResponse(
            x.Id, x.Slug, PublicTranslationHelpers.Pick(x.Requested?.Name, x.Ru?.Name, x.Name), x.SortOrder));

        return Results.Ok(items);
    }
}
