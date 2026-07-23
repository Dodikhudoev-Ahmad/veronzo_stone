using System.Security.Claims;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminPortfolioItemEndpoints
{
    private static readonly IReadOnlyDictionary<string, Func<PortfolioItem, IComparable>> SortWhitelist =
        new Dictionary<string, Func<PortfolioItem, IComparable>>
        {
            ["id"] = p => p.Id,
            ["title"] = p => p.Title,
            ["sortOrder"] = p => p.SortOrder
        };

    public static void MapAdminPortfolioItemEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/portfolio-items").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync)
            .WithSummary("List portfolio items")
            .WithDescription("Paginated, searchable (title/meta) and sortable list of portfolio items. Supports filtering by featured.")
            .Produces<PagedResult<PortfolioItemResponse>>(StatusCodes.Status200OK)
            .WithAdminAuthResponses();

        group.MapGet("/{id:int}", GetByIdAsync)
            .WithSummary("Get portfolio item by id")
            .Produces<PortfolioItemResponse>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();

        group.MapPost("", CreateAsync)
            .WithSummary("Create portfolio item")
            .Produces<PortfolioItemResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .WithAdminAuthResponses();

        group.MapPut("/{id:int}", UpdateAsync)
            .WithSummary("Update portfolio item")
            .Produces<PortfolioItemResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();

        group.MapDelete("/{id:int}", DeleteAsync)
            .WithSummary("Delete portfolio item")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();
    }

    private static async Task<IResult> ListAsync(
        int? page, int? pageSize, string? search, string? sort, bool? featured,
        AppDbContext db, CancellationToken cancellationToken)
    {
        var (p, ps) = AdminEndpointHelpers.NormalizePaging(page, pageSize);
        var items = await db.PortfolioItems.ToListAsync(cancellationToken);

        IEnumerable<PortfolioItem> filtered = items;
        if (featured is not null)
        {
            filtered = filtered.Where(x => x.IsFeatured == featured.Value);
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            filtered = filtered.Where(x =>
                x.Title.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                (x.Meta is not null && x.Meta.Contains(search, StringComparison.OrdinalIgnoreCase)));
        }

        var ordered = AdminEndpointHelpers.ApplySort(filtered, sort, SortWhitelist, "sortOrder").ThenBy(x => x.Id);
        return Results.Ok(AdminEndpointHelpers.Paginate(ordered, p, ps, ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var item = await db.PortfolioItems.FindAsync(new object[] { id }, cancellationToken);
        return item is null ? Results.NotFound(new ApiErrorResponse("Portfolio item not found")) : Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> CreateAsync(
        PortfolioItemRequest request, IValidator<PortfolioItemRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var item = new PortfolioItem
        {
            Title = request.Title,
            Meta = request.Meta,
            CategoryTag = request.CategoryTag,
            ImageUrl = request.ImageUrl,
            SortOrder = request.SortOrder,
            IsVisible = request.IsVisible,
            IsFeatured = request.IsFeatured
        };
        db.PortfolioItems.Add(item);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Create", nameof(PortfolioItem), item.Id);
        return Results.Created($"/api/admin/portfolio-items/{item.Id}", ToResponse(item));
    }

    private static async Task<IResult> UpdateAsync(
        int id, PortfolioItemRequest request, IValidator<PortfolioItemRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var item = await db.PortfolioItems.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new ApiErrorResponse("Portfolio item not found"));
        }

        item.Title = request.Title;
        item.Meta = request.Meta;
        item.CategoryTag = request.CategoryTag;
        item.ImageUrl = request.ImageUrl;
        item.SortOrder = request.SortOrder;
        item.IsVisible = request.IsVisible;
        item.IsFeatured = request.IsFeatured;

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Update", nameof(PortfolioItem), item.Id);
        return Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> DeleteAsync(
        int id, AppDbContext db, ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var item = await db.PortfolioItems.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new ApiErrorResponse("Portfolio item not found"));
        }

        db.PortfolioItems.Remove(item);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Delete", nameof(PortfolioItem), id);
        return Results.NoContent();
    }

    private static PortfolioItemResponse ToResponse(PortfolioItem p) =>
        new(p.Id, p.Title, p.Meta, p.CategoryTag, p.ImageUrl, p.SortOrder, p.IsVisible, p.IsFeatured);
}
