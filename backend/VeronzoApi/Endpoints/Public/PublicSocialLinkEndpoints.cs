using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models.Public;

namespace VeronzoApi.Endpoints.Public;

public static class PublicSocialLinkEndpoints
{
    public static void MapPublicSocialLinkEndpoints(this WebApplication app)
    {
        app.MapGet("/api/public/social-links", ListAsync)
            .WithSummary("List visible social links")
            .WithDescription(
                "Public, unauthenticated. Only IsVisible=true links. SocialLink has no SortOrder — " +
                "ordered by Id (insertion order) for a stable, predictable response.")
            .Produces<PublicSocialLinkResponse[]>(StatusCodes.Status200OK);
    }

    private static async Task<IResult> ListAsync(AppDbContext db, CancellationToken cancellationToken)
    {
        var items = await db.SocialLinks
            .AsNoTracking()
            .Where(s => s.IsVisible)
            .OrderBy(s => s.Id)
            .Select(s => new PublicSocialLinkResponse(s.Platform, s.Url))
            .ToListAsync(cancellationToken);

        return Results.Ok(items);
    }
}
