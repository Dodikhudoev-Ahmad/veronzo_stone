using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models.Public;

namespace VeronzoApi.Endpoints.Public;

public static class PublicContactInfoEndpoints
{
    public static void MapPublicContactInfoEndpoints(this WebApplication app)
    {
        app.MapGet("/api/public/contact-info", ListAsync)
            .WithSummary("List contact info entries")
            .WithDescription(
                "Public, unauthenticated. ContactInfo has no IsVisible flag — every entry (showroom, " +
                "phone, email) is public by design, so all rows are returned, ordered by SortOrder then Id.")
            .Produces<PublicContactInfoResponse[]>(StatusCodes.Status200OK);
    }

    private static async Task<IResult> ListAsync(AppDbContext db, CancellationToken cancellationToken)
    {
        var items = await db.ContactInfos
            .AsNoTracking()
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Id)
            .Select(c => new PublicContactInfoResponse(c.Label, c.Value))
            .ToListAsync(cancellationToken);

        return Results.Ok(items);
    }
}
