using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminCategoryEndpoints
{
    public static void MapAdminCategoryEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/categories").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync);
        group.MapGet("/{id:int}", GetByIdAsync);
        group.MapPost("", CreateAsync);
        group.MapPut("/{id:int}", UpdateAsync);
        group.MapDelete("/{id:int}", DeleteAsync);
    }

    private static async Task<IResult> ListAsync(AppDbContext db, CancellationToken cancellationToken)
    {
        var categories = await db.Categories
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Id)
            .ToListAsync(cancellationToken);
        return Results.Ok(categories.Select(ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var category = await db.Categories.FindAsync(new object[] { id }, cancellationToken);
        return category is null ? Results.NotFound(new { error = "Category not found" }) : Results.Ok(ToResponse(category));
    }

    private static async Task<IResult> CreateAsync(
        CategoryRequest request, IValidator<CategoryRequest> validator, AppDbContext db, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        if (await db.Categories.AnyAsync(c => c.Slug == request.Slug, cancellationToken))
        {
            return Results.Conflict(new { error = "A category with this slug already exists" });
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

        return Results.Created($"/api/admin/categories/{category.Id}", ToResponse(category));
    }

    private static async Task<IResult> UpdateAsync(
        int id, CategoryRequest request, IValidator<CategoryRequest> validator, AppDbContext db, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var category = await db.Categories.FindAsync(new object[] { id }, cancellationToken);
        if (category is null)
        {
            return Results.NotFound(new { error = "Category not found" });
        }

        if (await db.Categories.AnyAsync(c => c.Slug == request.Slug && c.Id != id, cancellationToken))
        {
            return Results.Conflict(new { error = "A category with this slug already exists" });
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

        return Results.Ok(ToResponse(category));
    }

    private static async Task<IResult> DeleteAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var category = await db.Categories.FindAsync(new object[] { id }, cancellationToken);
        if (category is null)
        {
            return Results.NotFound(new { error = "Category not found" });
        }

        if (await db.Products.AnyAsync(p => p.CategoryId == id, cancellationToken))
        {
            return Results.Conflict(new { error = "Cannot delete a category that still has products" });
        }

        db.Categories.Remove(category);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        return Results.NoContent();
    }

    private static CategoryResponse ToResponse(Category c) => new(c.Id, c.Slug, c.Name, c.SortOrder, c.IsVisible);
}
