using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
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
                "IsVisible=true, ordered by SortOrder then Id. Optional ?categorySlug= filter.")
            .Produces<PublicProductResponse[]>(StatusCodes.Status200OK);
    }

    private static async Task<IResult> ListAsync(string? categorySlug, AppDbContext db, CancellationToken cancellationToken)
    {
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

        var items = await query
            .OrderBy(x => x.Product.SortOrder).ThenBy(x => x.Product.Id)
            .Select(x => new PublicProductResponse(
                x.Product.Id, x.Product.CategoryId, x.Product.Title, x.Product.Description,
                x.Product.BadgeText, x.Product.ImageUrl, x.Product.SortOrder))
            .ToListAsync(cancellationToken);

        return Results.Ok(items);
    }
}
