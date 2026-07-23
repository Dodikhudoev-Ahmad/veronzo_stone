using System.Security.Claims;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminGalleryItemEndpoints
{
    private static readonly IReadOnlyDictionary<string, Func<GalleryItem, IComparable>> SortWhitelist =
        new Dictionary<string, Func<GalleryItem, IComparable>>
        {
            ["id"] = g => g.Id,
            ["title"] = g => g.Title,
            ["sortOrder"] = g => g.SortOrder
        };

    public static void MapAdminGalleryItemEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/gallery-items").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync)
            .WithSummary("List gallery items")
            .WithDescription("Paginated, searchable (title) and sortable list of gallery items.")
            .Produces<PagedResult<GalleryItemResponse>>(StatusCodes.Status200OK)
            .WithAdminAuthResponses();

        group.MapGet("/{id:int}", GetByIdAsync)
            .WithSummary("Get gallery item by id")
            .Produces<GalleryItemResponse>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();

        group.MapPost("", CreateAsync)
            .WithSummary("Create gallery item")
            .Produces<GalleryItemResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .WithAdminAuthResponses();

        group.MapPut("/{id:int}", UpdateAsync)
            .WithSummary("Update gallery item")
            .Produces<GalleryItemResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();

        group.MapDelete("/{id:int}", DeleteAsync)
            .WithSummary("Delete gallery item")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();
    }

    private static async Task<IResult> ListAsync(
        int? page, int? pageSize, string? search, string? sort, AppDbContext db, CancellationToken cancellationToken)
    {
        var (p, ps) = AdminEndpointHelpers.NormalizePaging(page, pageSize);
        var items = await db.GalleryItems.ToListAsync(cancellationToken);

        IEnumerable<GalleryItem> filtered = items;
        if (!string.IsNullOrWhiteSpace(search))
        {
            filtered = filtered.Where(x => x.Title.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        var ordered = AdminEndpointHelpers.ApplySort(filtered, sort, SortWhitelist, "sortOrder").ThenBy(x => x.Id);
        return Results.Ok(AdminEndpointHelpers.Paginate(ordered, p, ps, ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var item = await db.GalleryItems.FindAsync(new object[] { id }, cancellationToken);
        return item is null ? Results.NotFound(new ApiErrorResponse("Gallery item not found")) : Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> CreateAsync(
        GalleryItemRequest request, IValidator<GalleryItemRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var item = new GalleryItem
        {
            Title = request.Title,
            ImageUrl = request.ImageUrl,
            SortOrder = request.SortOrder,
            IsVisible = request.IsVisible
        };
        db.GalleryItems.Add(item);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Create", nameof(GalleryItem), item.Id);
        return Results.Created($"/api/admin/gallery-items/{item.Id}", ToResponse(item));
    }

    private static async Task<IResult> UpdateAsync(
        int id, GalleryItemRequest request, IValidator<GalleryItemRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var item = await db.GalleryItems.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new ApiErrorResponse("Gallery item not found"));
        }

        item.Title = request.Title;
        item.ImageUrl = request.ImageUrl;
        item.SortOrder = request.SortOrder;
        item.IsVisible = request.IsVisible;

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Update", nameof(GalleryItem), item.Id);
        return Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> DeleteAsync(
        int id, AppDbContext db, ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var item = await db.GalleryItems.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new ApiErrorResponse("Gallery item not found"));
        }

        db.GalleryItems.Remove(item);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Delete", nameof(GalleryItem), id);
        return Results.NoContent();
    }

    private static GalleryItemResponse ToResponse(GalleryItem g) => new(g.Id, g.Title, g.ImageUrl, g.SortOrder, g.IsVisible);
}
