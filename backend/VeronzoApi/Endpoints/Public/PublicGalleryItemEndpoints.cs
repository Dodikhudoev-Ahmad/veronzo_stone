using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models.Public;

namespace VeronzoApi.Endpoints.Public;

public static class PublicGalleryItemEndpoints
{
    public static void MapPublicGalleryItemEndpoints(this WebApplication app)
    {
        app.MapGet("/api/public/gallery-items", ListAsync)
            .WithSummary("List visible gallery items")
            .WithDescription("Public, unauthenticated. Only IsVisible=true items, ordered by SortOrder then Id.")
            .Produces<PublicGalleryItemResponse[]>(StatusCodes.Status200OK);
    }

    private static async Task<IResult> ListAsync(AppDbContext db, CancellationToken cancellationToken)
    {
        var items = await db.GalleryItems
            .AsNoTracking()
            .Where(g => g.IsVisible)
            .OrderBy(g => g.SortOrder).ThenBy(g => g.Id)
            .Select(g => new PublicGalleryItemResponse(g.Id, g.Title, g.ImageUrl, g.SortOrder))
            .ToListAsync(cancellationToken);

        return Results.Ok(items);
    }
}
