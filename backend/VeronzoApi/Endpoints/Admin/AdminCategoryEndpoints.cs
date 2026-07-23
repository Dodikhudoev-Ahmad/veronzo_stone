using System.Security.Claims;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminCategoryEndpoints
{
    private static readonly IReadOnlyDictionary<string, Func<Category, IComparable>> SortWhitelist =
        new Dictionary<string, Func<Category, IComparable>>
        {
            ["id"] = c => c.Id,
            ["slug"] = c => c.Slug,
            ["name"] = c => c.Name,
            ["sortOrder"] = c => c.SortOrder
        };

    public static void MapAdminCategoryEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/categories").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync)
            .WithSummary("List categories")
            .WithDescription("Paginated, searchable (name/slug) and sortable list of catalog categories.")
            .Produces<PagedResult<CategoryResponse>>(StatusCodes.Status200OK)
            .WithAdminAuthResponses();

        group.MapGet("/{id:int}", GetByIdAsync)
            .WithSummary("Get category by id")
            .Produces<CategoryResponse>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();

        group.MapPost("", CreateAsync)
            .WithSummary("Create category")
            .WithDescription("Slug must be unique.")
            .Produces<CategoryResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict)
            .WithAdminAuthResponses();

        group.MapPut("/{id:int}", UpdateAsync)
            .WithSummary("Update category")
            .Produces<CategoryResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict)
            .WithAdminAuthResponses();

        group.MapDelete("/{id:int}", DeleteAsync)
            .WithSummary("Delete category")
            .WithDescription("Fails with 409 if the category still has products.")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict)
            .WithAdminAuthResponses();
    }

    private static async Task<IResult> ListAsync(
        int? page, int? pageSize, string? search, string? sort, AppDbContext db, CancellationToken cancellationToken)
    {
        var (p, ps) = AdminEndpointHelpers.NormalizePaging(page, pageSize);
        var categories = await db.Categories.ToListAsync(cancellationToken);

        IEnumerable<Category> filtered = categories;
        if (!string.IsNullOrWhiteSpace(search))
        {
            filtered = filtered.Where(c =>
                c.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                c.Slug.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        var ordered = AdminEndpointHelpers.ApplySort(filtered, sort, SortWhitelist, "sortOrder").ThenBy(c => c.Id);
        return Results.Ok(AdminEndpointHelpers.Paginate(ordered, p, ps, ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var category = await db.Categories.FindAsync(new object[] { id }, cancellationToken);
        return category is null ? Results.NotFound(new ApiErrorResponse("Category not found")) : Results.Ok(ToResponse(category));
    }

    private static async Task<IResult> CreateAsync(
        CategoryRequest request, IValidator<CategoryRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        if (await db.Categories.AnyAsync(c => c.Slug == request.Slug, cancellationToken))
        {
            return Results.Conflict(new ApiErrorResponse("A category with this slug already exists"));
        }

        var category = new Category
        {
            Slug = request.Slug,
            Name = request.Name,
            SortOrder = request.SortOrder,
            IsVisible = request.IsVisible
        };
        db.Categories.Add(category);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Create", nameof(Category), category.Id);
        return Results.Created($"/api/admin/categories/{category.Id}", ToResponse(category));
    }

    private static async Task<IResult> UpdateAsync(
        int id, CategoryRequest request, IValidator<CategoryRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var category = await db.Categories.FindAsync(new object[] { id }, cancellationToken);
        if (category is null)
        {
            return Results.NotFound(new ApiErrorResponse("Category not found"));
        }

        if (await db.Categories.AnyAsync(c => c.Slug == request.Slug && c.Id != id, cancellationToken))
        {
            return Results.Conflict(new ApiErrorResponse("A category with this slug already exists"));
        }

        category.Slug = request.Slug;
        category.Name = request.Name;
        category.SortOrder = request.SortOrder;
        category.IsVisible = request.IsVisible;

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Update", nameof(Category), category.Id);
        return Results.Ok(ToResponse(category));
    }

    private static async Task<IResult> DeleteAsync(
        int id, AppDbContext db, ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var category = await db.Categories.FindAsync(new object[] { id }, cancellationToken);
        if (category is null)
        {
            return Results.NotFound(new ApiErrorResponse("Category not found"));
        }

        if (await db.Products.AnyAsync(p => p.CategoryId == id, cancellationToken))
        {
            return Results.Conflict(new ApiErrorResponse("Cannot delete a category that still has products"));
        }

        db.Categories.Remove(category);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Delete", nameof(Category), id);
        return Results.NoContent();
    }

    private static CategoryResponse ToResponse(Category c) => new(c.Id, c.Slug, c.Name, c.SortOrder, c.IsVisible);
}
