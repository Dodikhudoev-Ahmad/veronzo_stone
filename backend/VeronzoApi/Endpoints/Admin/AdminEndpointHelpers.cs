using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;

namespace VeronzoApi.Endpoints.Admin;

internal static class AdminEndpointHelpers
{
    // Shared by every admin CRUD endpoint's Create/Update/Delete handler so a unique-index
    // race or an unforeseen FK constraint always comes back as 409, never an unhandled
    // exception / 500.
    public static async Task<IResult?> TrySaveChangesAsync(AppDbContext db, CancellationToken cancellationToken)
    {
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            return null;
        }
        catch (DbUpdateException)
        {
            return Results.Conflict(new { error = "The request conflicts with existing data." });
        }
    }
}
