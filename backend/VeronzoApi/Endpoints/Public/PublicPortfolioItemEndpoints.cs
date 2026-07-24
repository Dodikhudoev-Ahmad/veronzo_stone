using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models.Public;

namespace VeronzoApi.Endpoints.Public;

public static class PublicPortfolioItemEndpoints
{
    public static void MapPublicPortfolioItemEndpoints(this WebApplication app)
    {
        app.MapGet("/api/public/portfolio-items", ListAsync)
            .WithSummary("List visible portfolio items")
            .WithDescription("Public, unauthenticated. Only IsVisible=true items, ordered by SortOrder then Id.")
            .Produces<PublicPortfolioItemResponse[]>(StatusCodes.Status200OK);
    }

    private static async Task<IResult> ListAsync(AppDbContext db, CancellationToken cancellationToken)
    {
        var items = await db.PortfolioItems
            .AsNoTracking()
            .Where(p => p.IsVisible)
            .OrderBy(p => p.SortOrder).ThenBy(p => p.Id)
            .Select(p => new PublicPortfolioItemResponse(p.Id, p.Title, p.Meta, p.CategoryTag, p.ImageUrl, p.SortOrder, p.IsFeatured))
            .ToListAsync(cancellationToken);

        return Results.Ok(items);
    }
}
