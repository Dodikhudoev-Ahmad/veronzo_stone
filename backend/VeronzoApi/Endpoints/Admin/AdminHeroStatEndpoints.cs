using System.Security.Claims;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminHeroStatEndpoints
{
    private static readonly IReadOnlyDictionary<string, Func<HeroStat, IComparable>> SortWhitelist =
        new Dictionary<string, Func<HeroStat, IComparable>>
        {
            ["id"] = h => h.Id,
            ["label"] = h => h.Label,
            ["value"] = h => h.Value,
            ["sortOrder"] = h => h.SortOrder
        };

    public static void MapAdminHeroStatEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/hero-stats").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync)
            .WithSummary("List hero stats")
            .WithDescription("Paginated, sortable list of hero-section statistics. Supports filtering by enabled.")
            .Produces<PagedResult<HeroStatResponse>>(StatusCodes.Status200OK)
            .WithAdminAuthResponses();

        group.MapGet("/{id:int}", GetByIdAsync)
            .WithSummary("Get hero stat by id")
            .Produces<HeroStatResponse>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();

        group.MapPost("", CreateAsync)
            .WithSummary("Create hero stat")
            .Produces<HeroStatResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .WithAdminAuthResponses();

        group.MapPut("/{id:int}", UpdateAsync)
            .WithSummary("Update hero stat")
            .Produces<HeroStatResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();

        group.MapDelete("/{id:int}", DeleteAsync)
            .WithSummary("Delete hero stat")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();
    }

    private static async Task<IResult> ListAsync(
        int? page, int? pageSize, string? sort, bool? enabled, AppDbContext db, CancellationToken cancellationToken)
    {
        var (p, ps) = AdminEndpointHelpers.NormalizePaging(page, pageSize);
        var stats = await db.HeroStats.ToListAsync(cancellationToken);

        IEnumerable<HeroStat> filtered = stats;
        if (enabled is not null)
        {
            filtered = filtered.Where(x => x.IsVisible == enabled.Value);
        }

        var ordered = AdminEndpointHelpers.ApplySort(filtered, sort, SortWhitelist, "sortOrder").ThenBy(x => x.Id);
        return Results.Ok(AdminEndpointHelpers.Paginate(ordered, p, ps, ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var stat = await db.HeroStats.FindAsync(new object[] { id }, cancellationToken);
        return stat is null ? Results.NotFound(new ApiErrorResponse("Hero stat not found")) : Results.Ok(ToResponse(stat));
    }

    private static async Task<IResult> CreateAsync(
        HeroStatRequest request, IValidator<HeroStatRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var stat = new HeroStat
        {
            Label = request.Label,
            Value = request.Value,
            Suffix = request.Suffix,
            SortOrder = request.SortOrder,
            IsVisible = request.IsVisible
        };
        db.HeroStats.Add(stat);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Create", nameof(HeroStat), stat.Id);
        return Results.Created($"/api/admin/hero-stats/{stat.Id}", ToResponse(stat));
    }

    private static async Task<IResult> UpdateAsync(
        int id, HeroStatRequest request, IValidator<HeroStatRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var stat = await db.HeroStats.FindAsync(new object[] { id }, cancellationToken);
        if (stat is null)
        {
            return Results.NotFound(new ApiErrorResponse("Hero stat not found"));
        }

        stat.Label = request.Label;
        stat.Value = request.Value;
        stat.Suffix = request.Suffix;
        stat.SortOrder = request.SortOrder;
        stat.IsVisible = request.IsVisible;

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Update", nameof(HeroStat), stat.Id);
        return Results.Ok(ToResponse(stat));
    }

    private static async Task<IResult> DeleteAsync(
        int id, AppDbContext db, ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var stat = await db.HeroStats.FindAsync(new object[] { id }, cancellationToken);
        if (stat is null)
        {
            return Results.NotFound(new ApiErrorResponse("Hero stat not found"));
        }

        db.HeroStats.Remove(stat);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Delete", nameof(HeroStat), id);
        return Results.NoContent();
    }

    private static HeroStatResponse ToResponse(HeroStat h) => new(h.Id, h.Label, h.Value, h.Suffix, h.SortOrder, h.IsVisible);
}
