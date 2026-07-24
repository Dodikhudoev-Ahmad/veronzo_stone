using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models.Public;

namespace VeronzoApi.Endpoints.Public;

public static class PublicCategoryEndpoints
{
    public static void MapPublicCategoryEndpoints(this WebApplication app)
    {
        app.MapGet("/api/public/categories", ListAsync)
            .WithSummary("List visible categories")
            .WithDescription("Public, unauthenticated. Only IsVisible=true categories, ordered by SortOrder then Id.")
            .Produces<PublicCategoryResponse[]>(StatusCodes.Status200OK);
    }

    private static async Task<IResult> ListAsync(AppDbContext db, CancellationToken cancellationToken)
    {
        var items = await db.Categories
            .AsNoTracking()
            .Where(c => c.IsVisible)
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Id)
            .Select(c => new PublicCategoryResponse(c.Id, c.Slug, c.Name, c.SortOrder))
            .ToListAsync(cancellationToken);

        return Results.Ok(items);
    }
}
