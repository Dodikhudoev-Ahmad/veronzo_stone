using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models.Public;

namespace VeronzoApi.Endpoints.Public;

public static class PublicHeroStatEndpoints
{
    public static void MapPublicHeroStatEndpoints(this WebApplication app)
    {
        app.MapGet("/api/public/hero-stats", ListAsync)
            .WithSummary("List visible hero stats")
            .WithDescription("Public, unauthenticated. Only IsVisible=true stats, ordered by SortOrder then Id.")
            .Produces<PublicHeroStatResponse[]>(StatusCodes.Status200OK);
    }

    private static async Task<IResult> ListAsync(AppDbContext db, CancellationToken cancellationToken)
    {
        var items = await db.HeroStats
            .AsNoTracking()
            .Where(h => h.IsVisible)
            .OrderBy(h => h.SortOrder).ThenBy(h => h.Id)
            .Select(h => new PublicHeroStatResponse(h.Id, h.Label, h.Value, h.Suffix, h.SortOrder))
            .ToListAsync(cancellationToken);

        return Results.Ok(items);
    }
}
