using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Public;

namespace VeronzoApi.Endpoints.Public;

public static class PublicProductEndpoints
{
    public static void MapPublicProductEndpoints(this WebApplication app)
    {
        app.MapGet("/api/public/products", ListAsync)
            .WithSummary("List visible products")
            .WithDescription(
                "Public, unauthenticated. Only IsVisible=true products whose category is also " +
                "IsVisible=true, ordered by SortOrder then Id. Optional ?categorySlug= filter and " +
                "optional ?lang= (ru/tg/en/zh, default ru) with ru-then-legacy-field fallback.")
            .Produces<PublicProductResponse[]>(StatusCodes.Status200OK);
    }

    private static async Task<IResult> ListAsync(
        string? categorySlug, string? lang, AppDbContext db, CancellationToken cancellationToken)
    {
        var language = SupportedLanguages.Normalize(lang);

        // A product in a hidden category (e.g. "windows" before the owner supplies
        // real copy/photos) must stay hidden too, even though Product.IsVisible
        // itself might be true — the join enforces that without needing a second
        // round trip.
        var query =
            from p in db.Products.AsNoTracking()
            join c in db.Categories.AsNoTracking() on p.CategoryId equals c.Id
            where p.IsVisible && c.IsVisible
            select new { Product = p, Category = c };

        if (!string.IsNullOrWhiteSpace(categorySlug))
        {
            query = query.Where(x => x.Category.Slug == categorySlug);
        }

        var raw = await query
            .OrderBy(x => x.Product.SortOrder).ThenBy(x => x.Product.Id)
            .Select(x => new
            {
                x.Product.Id,
                x.Product.CategoryId,
                x.Product.Title,
                x.Product.Description,
                x.Product.BadgeText,
                x.Product.ImageUrl,
                x.Product.SortOrder,
                Requested = x.Product.Translations.FirstOrDefault(t => t.LanguageCode == language),
                Ru = x.Product.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default)
            })
            .ToListAsync(cancellationToken);

        var items = raw.Select(x => new PublicProductResponse(
            x.Id, x.CategoryId,
            PublicTranslationHelpers.Pick(x.Requested?.Title, x.Ru?.Title, x.Title),
            PublicTranslationHelpers.PickNullable(x.Requested?.Description, x.Ru?.Description, x.Description),
            PublicTranslationHelpers.PickNullable(x.Requested?.BadgeText, x.Ru?.BadgeText, x.BadgeText),
            x.ImageUrl, x.SortOrder));

        return Results.Ok(items);
    }
}
