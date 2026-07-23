using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminProductEndpoints
{
    public static void MapAdminProductEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/products").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync);
        group.MapGet("/{id:int}", GetByIdAsync);
        group.MapPost("", CreateAsync);
        group.MapPut("/{id:int}", UpdateAsync);
        group.MapDelete("/{id:int}", DeleteAsync);
    }

    private static async Task<IResult> ListAsync(AppDbContext db, CancellationToken cancellationToken)
    {
        var products = await db.Products
            .OrderBy(p => p.SortOrder).ThenBy(p => p.Id)
            .ToListAsync(cancellationToken);
        return Results.Ok(products.Select(ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var product = await db.Products.FindAsync(new object[] { id }, cancellationToken);
        return product is null ? Results.NotFound(new { error = "Product not found" }) : Results.Ok(ToResponse(product));
    }

    private static async Task<IResult> CreateAsync(
        ProductRequest request, IValidator<ProductRequest> validator, AppDbContext db, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        if (!await db.Categories.AnyAsync(c => c.Id == request.CategoryId, cancellationToken))
        {
            return Results.BadRequest(new { error = "CategoryId does not exist" });
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

        return Results.Created($"/api/admin/products/{product.Id}", ToResponse(product));
    }

    private static async Task<IResult> UpdateAsync(
        int id, ProductRequest request, IValidator<ProductRequest> validator, AppDbContext db, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var product = await db.Products.FindAsync(new object[] { id }, cancellationToken);
        if (product is null)
        {
            return Results.NotFound(new { error = "Product not found" });
        }

        if (!await db.Categories.AnyAsync(c => c.Id == request.CategoryId, cancellationToken))
        {
            return Results.BadRequest(new { error = "CategoryId does not exist" });
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

        return Results.Ok(ToResponse(product));
    }

    private static async Task<IResult> DeleteAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var product = await db.Products.FindAsync(new object[] { id }, cancellationToken);
        if (product is null)
        {
            return Results.NotFound(new { error = "Product not found" });
        }

        db.Products.Remove(product);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        return Results.NoContent();
    }

    private static ProductResponse ToResponse(Product p) =>
        new(p.Id, p.CategoryId, p.Title, p.Description, p.BadgeText, p.ImageUrl, p.SortOrder, p.IsVisible);
}
