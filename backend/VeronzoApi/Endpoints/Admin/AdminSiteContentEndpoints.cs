using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminSiteContentEndpoints
{
    public static void MapAdminSiteContentEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/site-content").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync);
        group.MapGet("/{id:int}", GetByIdAsync);
        group.MapPost("", CreateAsync);
        group.MapPut("/{id:int}", UpdateAsync);
        group.MapDelete("/{id:int}", DeleteAsync);
    }

    // SiteContent has no SortOrder field — ordered by Id only.
    private static async Task<IResult> ListAsync(AppDbContext db, CancellationToken cancellationToken)
    {
        var items = await db.SiteContents.OrderBy(c => c.Id).ToListAsync(cancellationToken);
        return Results.Ok(items.Select(ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var item = await db.SiteContents.FindAsync(new object[] { id }, cancellationToken);
        return item is null ? Results.NotFound(new { error = "Site content not found" }) : Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> CreateAsync(
        SiteContentRequest request, IValidator<SiteContentRequest> validator, AppDbContext db, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        if (await db.SiteContents.AnyAsync(c => c.Key == request.Key, cancellationToken))
        {
            return Results.Conflict(new { error = "A content entry with this key already exists" });
        }

        var item = new SiteContent { Key = request.Key, Value = request.Value };
        db.SiteContents.Add(item);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        return Results.Created($"/api/admin/site-content/{item.Id}", ToResponse(item));
    }

    private static async Task<IResult> UpdateAsync(
        int id, SiteContentRequest request, IValidator<SiteContentRequest> validator, AppDbContext db, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var item = await db.SiteContents.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new { error = "Site content not found" });
        }

        if (await db.SiteContents.AnyAsync(c => c.Key == request.Key && c.Id != id, cancellationToken))
        {
            return Results.Conflict(new { error = "A content entry with this key already exists" });
        }

        item.Key = request.Key;
        item.Value = request.Value;

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        return Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> DeleteAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var item = await db.SiteContents.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new { error = "Site content not found" });
        }

        db.SiteContents.Remove(item);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        return Results.NoContent();
    }

    private static SiteContentResponse ToResponse(SiteContent c) => new(c.Id, c.Key, c.Value);
}
