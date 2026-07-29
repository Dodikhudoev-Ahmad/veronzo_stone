using System.Security.Claims;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminProductImageEndpoints
{
    private static readonly IReadOnlyDictionary<string, Func<ProductImage, IComparable>> SortWhitelist =
        new Dictionary<string, Func<ProductImage, IComparable>>
        {
            ["id"] = i => i.Id,
            ["productId"] = i => i.ProductId,
            ["sortOrder"] = i => i.SortOrder
        };

    public static void MapAdminProductImageEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/product-images").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync)
            .WithSummary("List product images")
            .WithDescription("Paginated, sortable list. Supports filtering by productId.")
            .Produces<PagedResult<ProductImageResponse>>(StatusCodes.Status200OK)
            .WithAdminAuthResponses();

        group.MapGet("/{id:int}", GetByIdAsync)
            .WithSummary("Get product image by id")
            .Produces<ProductImageResponse>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();

        group.MapPost("", CreateAsync)
            .WithSummary("Create product image")
            .WithDescription("ProductId must reference an existing product. ImageUrl must be unique within the product.")
            .Produces<ProductImageResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
            .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict)
            .WithAdminAuthResponses();

        group.MapPut("/{id:int}", UpdateAsync)
            .WithSummary("Update product image")
            .Produces<ProductImageResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict)
            .WithAdminAuthResponses();

        group.MapDelete("/{id:int}", DeleteAsync)
            .WithSummary("Delete product image")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();
    }

    private static async Task<IResult> ListAsync(
        int? page, int? pageSize, string? sort, int? productId,
        AppDbContext db, CancellationToken cancellationToken)
    {
        var (p, ps) = AdminEndpointHelpers.NormalizePaging(page, pageSize);
        var images = await db.ProductImages.ToListAsync(cancellationToken);

        IEnumerable<ProductImage> filtered = images;
        if (productId is not null)
        {
            filtered = filtered.Where(x => x.ProductId == productId.Value);
        }

        var ordered = AdminEndpointHelpers.ApplySort(filtered, sort, SortWhitelist, "sortOrder").ThenBy(x => x.Id);
        return Results.Ok(AdminEndpointHelpers.Paginate(ordered, p, ps, ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var image = await db.ProductImages.FindAsync(new object[] { id }, cancellationToken);
        return image is null ? Results.NotFound(new ApiErrorResponse("Product image not found")) : Results.Ok(ToResponse(image));
    }

    private static async Task<IResult> CreateAsync(
        ProductImageRequest request, IValidator<ProductImageRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        if (!await db.Products.AnyAsync(p => p.Id == request.ProductId, cancellationToken))
        {
            return Results.BadRequest(new ApiErrorResponse("ProductId does not exist"));
        }

        var image = new ProductImage
        {
            ProductId = request.ProductId,
            ImageUrl = request.ImageUrl,
            SortOrder = request.SortOrder
        };
        db.ProductImages.Add(image);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Create", nameof(ProductImage), image.Id);
        return Results.Created($"/api/admin/product-images/{image.Id}", ToResponse(image));
    }

    private static async Task<IResult> UpdateAsync(
        int id, ProductImageRequest request, IValidator<ProductImageRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var image = await db.ProductImages.FindAsync(new object[] { id }, cancellationToken);
        if (image is null)
        {
            return Results.NotFound(new ApiErrorResponse("Product image not found"));
        }

        if (!await db.Products.AnyAsync(p => p.Id == request.ProductId, cancellationToken))
        {
            return Results.BadRequest(new ApiErrorResponse("ProductId does not exist"));
        }

        image.ProductId = request.ProductId;
        image.ImageUrl = request.ImageUrl;
        image.SortOrder = request.SortOrder;

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Update", nameof(ProductImage), image.Id);
        return Results.Ok(ToResponse(image));
    }

    private static async Task<IResult> DeleteAsync(
        int id, AppDbContext db, ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var image = await db.ProductImages.FindAsync(new object[] { id }, cancellationToken);
        if (image is null)
        {
            return Results.NotFound(new ApiErrorResponse("Product image not found"));
        }

        db.ProductImages.Remove(image);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Delete", nameof(ProductImage), id);
        return Results.NoContent();
    }

    private static ProductImageResponse ToResponse(ProductImage i) => new(i.Id, i.ProductId, i.ImageUrl, i.SortOrder);
}
