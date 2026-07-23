using System.Security.Claims;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminProductEndpoints
{
    private static readonly IReadOnlyDictionary<string, Func<Product, IComparable>> SortWhitelist =
        new Dictionary<string, Func<Product, IComparable>>
        {
            ["id"] = p => p.Id,
            ["title"] = p => p.Title,
            ["sortOrder"] = p => p.SortOrder,
            ["categoryId"] = p => p.CategoryId
        };

    public static void MapAdminProductEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/products").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync)
            .WithSummary("List products")
            .WithDescription("Paginated, searchable (title/description) and sortable list of products. Supports filtering by categoryId.")
            .Produces<PagedResult<ProductResponse>>(StatusCodes.Status200OK)
            .WithAdminAuthResponses();

        group.MapGet("/{id:int}", GetByIdAsync)
            .WithSummary("Get product by id")
            .Produces<ProductResponse>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();

        group.MapPost("", CreateAsync)
            .WithSummary("Create product")
            .WithDescription("CategoryId must reference an existing category.")
            .Produces<ProductResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
            .WithAdminAuthResponses();

        group.MapPut("/{id:int}", UpdateAsync)
            .WithSummary("Update product")
            .Produces<ProductResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();

        group.MapDelete("/{id:int}", DeleteAsync)
            .WithSummary("Delete product")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();
    }

    private static async Task<IResult> ListAsync(
        int? page, int? pageSize, string? search, string? sort, int? categoryId,
        AppDbContext db, CancellationToken cancellationToken)
    {
        var (p, ps) = AdminEndpointHelpers.NormalizePaging(page, pageSize);
        var products = await db.Products.ToListAsync(cancellationToken);

        IEnumerable<Product> filtered = products;
        if (categoryId is not null)
        {
            filtered = filtered.Where(x => x.CategoryId == categoryId.Value);
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            filtered = filtered.Where(x =>
                x.Title.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                (x.Description is not null && x.Description.Contains(search, StringComparison.OrdinalIgnoreCase)));
        }

        var ordered = AdminEndpointHelpers.ApplySort(filtered, sort, SortWhitelist, "sortOrder").ThenBy(x => x.Id);
        return Results.Ok(AdminEndpointHelpers.Paginate(ordered, p, ps, ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var product = await db.Products.FindAsync(new object[] { id }, cancellationToken);
        return product is null ? Results.NotFound(new ApiErrorResponse("Product not found")) : Results.Ok(ToResponse(product));
    }

    private static async Task<IResult> CreateAsync(
        ProductRequest request, IValidator<ProductRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        if (!await db.Categories.AnyAsync(c => c.Id == request.CategoryId, cancellationToken))
        {
            return Results.BadRequest(new ApiErrorResponse("CategoryId does not exist"));
        }

        var product = new Product
        {
            CategoryId = request.CategoryId,
            Title = request.Title,
            Description = request.Description,
            BadgeText = request.BadgeText,
            ImageUrl = request.ImageUrl,
            SortOrder = request.SortOrder,
            IsVisible = request.IsVisible
        };
        db.Products.Add(product);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Create", nameof(Product), product.Id);
        return Results.Created($"/api/admin/products/{product.Id}", ToResponse(product));
    }

    private static async Task<IResult> UpdateAsync(
        int id, ProductRequest request, IValidator<ProductRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var product = await db.Products.FindAsync(new object[] { id }, cancellationToken);
        if (product is null)
        {
            return Results.NotFound(new ApiErrorResponse("Product not found"));
        }

        if (!await db.Categories.AnyAsync(c => c.Id == request.CategoryId, cancellationToken))
        {
            return Results.BadRequest(new ApiErrorResponse("CategoryId does not exist"));
        }

        product.CategoryId = request.CategoryId;
        product.Title = request.Title;
        product.Description = request.Description;
        product.BadgeText = request.BadgeText;
        product.ImageUrl = request.ImageUrl;
        product.SortOrder = request.SortOrder;
        product.IsVisible = request.IsVisible;

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Update", nameof(Product), product.Id);
        return Results.Ok(ToResponse(product));
    }

    private static async Task<IResult> DeleteAsync(
        int id, AppDbContext db, ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var product = await db.Products.FindAsync(new object[] { id }, cancellationToken);
        if (product is null)
        {
            return Results.NotFound(new ApiErrorResponse("Product not found"));
        }

        db.Products.Remove(product);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Delete", nameof(Product), id);
        return Results.NoContent();
    }

    private static ProductResponse ToResponse(Product p) =>
        new(p.Id, p.CategoryId, p.Title, p.Description, p.BadgeText, p.ImageUrl, p.SortOrder, p.IsVisible);
}
