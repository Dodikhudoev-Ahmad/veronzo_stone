using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminPortfolioItemEndpoints
{
    public static void MapAdminPortfolioItemEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/portfolio-items").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync);
        group.MapGet("/{id:int}", GetByIdAsync);
        group.MapPost("", CreateAsync);
        group.MapPut("/{id:int}", UpdateAsync);
        group.MapDelete("/{id:int}", DeleteAsync);
    }

    private static async Task<IResult> ListAsync(AppDbContext db, CancellationToken cancellationToken)
    {
        var items = await db.PortfolioItems
            .OrderBy(p => p.SortOrder).ThenBy(p => p.Id)
            .ToListAsync(cancellationToken);
        return Results.Ok(items.Select(ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var item = await db.PortfolioItems.FindAsync(new object[] { id }, cancellationToken);
        return item is null ? Results.NotFound(new { error = "Portfolio item not found" }) : Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> CreateAsync(
        PortfolioItemRequest request, IValidator<PortfolioItemRequest> validator, AppDbContext db, CancellationToken cancellationToken)
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

        return Results.Created($"/api/admin/portfolio-items/{item.Id}", ToResponse(item));
    }

    private static async Task<IResult> UpdateAsync(
        int id, PortfolioItemRequest request, IValidator<PortfolioItemRequest> validator, AppDbContext db, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var item = await db.PortfolioItems.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new { error = "Portfolio item not found" });
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

        return Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> DeleteAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var item = await db.PortfolioItems.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new { error = "Portfolio item not found" });
        }

        db.PortfolioItems.Remove(item);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        return Results.NoContent();
    }

    private static PortfolioItemResponse ToResponse(PortfolioItem p) =>
        new(p.Id, p.Title, p.Meta, p.CategoryTag, p.ImageUrl, p.SortOrder, p.IsVisible, p.IsFeatured);
}
