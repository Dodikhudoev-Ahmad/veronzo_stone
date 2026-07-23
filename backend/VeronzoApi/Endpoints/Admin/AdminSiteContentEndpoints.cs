using System.Security.Claims;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminSiteContentEndpoints
{
    private static readonly IReadOnlyDictionary<string, Func<SiteContent, IComparable>> SortWhitelist =
        new Dictionary<string, Func<SiteContent, IComparable>>
        {
            ["id"] = c => c.Id,
            ["key"] = c => c.Key
        };

    public static void MapAdminSiteContentEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/site-content").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync)
            .WithSummary("List site content entries")
            .WithDescription("Paginated, searchable (key/value) and sortable list of editable site text blocks.")
            .Produces<PagedResult<SiteContentResponse>>(StatusCodes.Status200OK)
            .WithAdminAuthResponses();

        group.MapGet("/{id:int}", GetByIdAsync)
            .WithSummary("Get site content entry by id")
            .Produces<SiteContentResponse>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();

        group.MapPost("", CreateAsync)
            .WithSummary("Create site content entry")
            .WithDescription("Key must be unique.")
            .Produces<SiteContentResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict)
            .WithAdminAuthResponses();

        group.MapPut("/{id:int}", UpdateAsync)
            .WithSummary("Update site content entry")
            .Produces<SiteContentResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict)
            .WithAdminAuthResponses();

        group.MapDelete("/{id:int}", DeleteAsync)
            .WithSummary("Delete site content entry")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();
    }

    private static async Task<IResult> ListAsync(
        int? page, int? pageSize, string? search, string? sort, AppDbContext db, CancellationToken cancellationToken)
    {
        var (p, ps) = AdminEndpointHelpers.NormalizePaging(page, pageSize);
        var items = await db.SiteContents.ToListAsync(cancellationToken);

        IEnumerable<SiteContent> filtered = items;
        if (!string.IsNullOrWhiteSpace(search))
        {
            filtered = filtered.Where(c =>
                c.Key.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                c.Value.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        var ordered = AdminEndpointHelpers.ApplySort(filtered, sort, SortWhitelist, "id").ThenBy(c => c.Id);
        return Results.Ok(AdminEndpointHelpers.Paginate(ordered, p, ps, ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var item = await db.SiteContents.FindAsync(new object[] { id }, cancellationToken);
        return item is null ? Results.NotFound(new ApiErrorResponse("Site content not found")) : Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> CreateAsync(
        SiteContentRequest request, IValidator<SiteContentRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        if (await db.SiteContents.AnyAsync(c => c.Key == request.Key, cancellationToken))
        {
            return Results.Conflict(new ApiErrorResponse("A content entry with this key already exists"));
        }

        var item = new SiteContent { Key = request.Key, Value = request.Value };
        db.SiteContents.Add(item);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Create", nameof(SiteContent), item.Id);
        return Results.Created($"/api/admin/site-content/{item.Id}", ToResponse(item));
    }

    private static async Task<IResult> UpdateAsync(
        int id, SiteContentRequest request, IValidator<SiteContentRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var item = await db.SiteContents.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new ApiErrorResponse("Site content not found"));
        }

        if (await db.SiteContents.AnyAsync(c => c.Key == request.Key && c.Id != id, cancellationToken))
        {
            return Results.Conflict(new ApiErrorResponse("A content entry with this key already exists"));
        }

        item.Key = request.Key;
        item.Value = request.Value;

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Update", nameof(SiteContent), item.Id);
        return Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> DeleteAsync(
        int id, AppDbContext db, ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var item = await db.SiteContents.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new ApiErrorResponse("Site content not found"));
        }

        db.SiteContents.Remove(item);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Delete", nameof(SiteContent), id);
        return Results.NoContent();
    }

    private static SiteContentResponse ToResponse(SiteContent c) => new(c.Id, c.Key, c.Value);
}
