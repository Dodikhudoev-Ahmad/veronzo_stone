using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models.Admin;
using VeronzoApi.Models.Public;

namespace VeronzoApi.Endpoints.Public;

public static class PublicSeoMetaEndpoints
{
    public static void MapPublicSeoMetaEndpoints(this WebApplication app)
    {
        // Single-resource lookup by PageKey rather than a full list — PageKey is
        // already unique-indexed, and a page only ever needs its own SEO metadata,
        // never every page's at once (see final report for the reasoning).
        app.MapGet("/api/public/seo-meta/{pageKey}", GetByPageKeyAsync)
            .WithSummary("Get SEO metadata for a page")
            .WithDescription("Public, unauthenticated. Looks up by PageKey (e.g. \"home\").")
            .Produces<PublicSeoMetaResponse>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound);
    }

    private static async Task<IResult> GetByPageKeyAsync(string pageKey, AppDbContext db, CancellationToken cancellationToken)
    {
        var item = await db.SeoMetas
            .AsNoTracking()
            .Where(s => s.PageKey == pageKey)
            .Select(s => new PublicSeoMetaResponse(s.PageKey, s.Title, s.Description, s.OgImageUrl))
            .FirstOrDefaultAsync(cancellationToken);

        return item is null
            ? Results.NotFound(new ApiErrorResponse("SEO metadata not found for this page"))
            : Results.Ok(item);
    }
}
