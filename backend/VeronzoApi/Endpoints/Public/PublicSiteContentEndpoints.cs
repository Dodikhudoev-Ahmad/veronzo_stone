using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models.Public;

namespace VeronzoApi.Endpoints.Public;

public static class PublicSiteContentEndpoints
{
    public static void MapPublicSiteContentEndpoints(this WebApplication app)
    {
        app.MapGet("/api/public/site-content", ListAsync)
            .WithSummary("List all site content entries")
            .WithDescription(
                "Public, unauthenticated. SiteContent has no IsVisible flag — every key/value pair is " +
                "public text content by design (hero copy, about/why/contacts text, footer tagline), " +
                "so all rows are returned, ordered by Key for a predictable/stable response.")
            .Produces<PublicSiteContentResponse[]>(StatusCodes.Status200OK);
    }

    private static async Task<IResult> ListAsync(AppDbContext db, CancellationToken cancellationToken)
    {
        var items = await db.SiteContents
            .AsNoTracking()
            .OrderBy(c => c.Key)
            .Select(c => new PublicSiteContentResponse(c.Key, c.Value))
            .ToListAsync(cancellationToken);

        return Results.Ok(items);
    }
}
