using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

internal static class AdminEndpointHelpers
{
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 100;

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
            return Results.Conflict(new ApiErrorResponse("The request conflicts with existing data."));
        }
    }

    public static (int Page, int PageSize) NormalizePaging(int? page, int? pageSize)
    {
        var normalizedPage = page is > 0 ? page.Value : 1;
        var normalizedPageSize = pageSize is > 0 ? Math.Min(pageSize.Value, MaxPageSize) : DefaultPageSize;
        return (normalizedPage, normalizedPageSize);
    }

    // `whitelist` is a fixed, compile-time dictionary of field-name -> property-accessor
    // built into each endpoint file — an unrecognized `sort` value simply falls back to
    // `defaultField` rather than being used to build a query. No string is ever turned
    // into LINQ/SQL, so this can't be used for injection the way dynamic LINQ can.
    public static IOrderedEnumerable<T> ApplySort<T>(
        IEnumerable<T> source, string? sort, IReadOnlyDictionary<string, Func<T, IComparable>> whitelist, string defaultField)
    {
        var field = defaultField;
        var descending = false;

        if (!string.IsNullOrWhiteSpace(sort))
        {
            var requested = sort.StartsWith('-') ? sort[1..] : sort;
            if (whitelist.ContainsKey(requested))
            {
                field = requested;
                descending = sort.StartsWith('-');
            }
        }

        var keySelector = whitelist[field];
        return descending ? source.OrderByDescending(keySelector) : source.OrderBy(keySelector);
    }

    public static PagedResult<TResponse> Paginate<TEntity, TResponse>(
        IEnumerable<TEntity> orderedSource, int page, int pageSize, Func<TEntity, TResponse> map)
    {
        var materialized = orderedSource as IList<TEntity> ?? orderedSource.ToList();
        var totalItems = materialized.Count;
        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);
        var items = materialized.Skip((page - 1) * pageSize).Take(pageSize).Select(map).ToList();
        return new PagedResult<TResponse>(items, page, pageSize, totalItems, totalPages);
    }

    // Structured audit line for every admin mutation — who (admin id/email from the JWT),
    // what (action), on which entity/id. Deliberately just ILogger, no dedicated audit
    // table, per this stage's scope.
    public static void LogAudit(ILogger logger, ClaimsPrincipal user, string action, string entityType, int entityId)
    {
        var adminId = user.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown";
        var adminEmail = user.FindFirstValue(JwtRegisteredClaimNames.Email) ?? user.FindFirstValue(ClaimTypes.Email) ?? "unknown";
        logger.LogInformation(
            "Admin audit: adminId={AdminId} adminEmail={AdminEmail} action={Action} entityType={EntityType} entityId={EntityId}",
            adminId, adminEmail, action, entityType, entityId);
    }
}
