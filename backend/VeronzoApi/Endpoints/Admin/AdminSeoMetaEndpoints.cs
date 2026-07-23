using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminSeoMetaEndpoints
{
    public static void MapAdminSeoMetaEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/seo-meta").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync);
        group.MapGet("/{id:int}", GetByIdAsync);
        group.MapPost("", CreateAsync);
        group.MapPut("/{id:int}", UpdateAsync);
        group.MapDelete("/{id:int}", DeleteAsync);
    }

    // SeoMeta has no SortOrder field — ordered by Id only.
    private static async Task<IResult> ListAsync(AppDbContext db, CancellationToken cancellationToken)
    {
        var items = await db.SeoMetas.OrderBy(s => s.Id).ToListAsync(cancellationToken);
        return Results.Ok(items.Select(ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var item = await db.SeoMetas.FindAsync(new object[] { id }, cancellationToken);
        return item is null ? Results.NotFound(new { error = "SEO meta not found" }) : Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> CreateAsync(
        SeoMetaRequest request, IValidator<SeoMetaRequest> validator, AppDbContext db, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        if (await db.SeoMetas.AnyAsync(s => s.PageKey == request.PageKey, cancellationToken))
        {
            return Results.Conflict(new { error = "An SEO entry with this PageKey already exists" });
        }

        var item = new SeoMeta
        {
            PageKey = request.PageKey,
            Title = request.Title,
            Description = request.Description,
            OgImageUrl = request.OgImageUrl
        };
        db.SeoMetas.Add(item);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        return Results.Created($"/api/admin/seo-meta/{item.Id}", ToResponse(item));
    }

    private static async Task<IResult> UpdateAsync(
        int id, SeoMetaRequest request, IValidator<SeoMetaRequest> validator, AppDbContext db, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var item = await db.SeoMetas.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new { error = "SEO meta not found" });
        }

        if (await db.SeoMetas.AnyAsync(s => s.PageKey == request.PageKey && s.Id != id, cancellationToken))
        {
            return Results.Conflict(new { error = "An SEO entry with this PageKey already exists" });
        }

        item.PageKey = request.PageKey;
        item.Title = request.Title;
        item.Description = request.Description;
        item.OgImageUrl = request.OgImageUrl;

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        return Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> DeleteAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var item = await db.SeoMetas.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new { error = "SEO meta not found" });
        }

        db.SeoMetas.Remove(item);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        return Results.NoContent();
    }

    private static SeoMetaResponse ToResponse(SeoMeta s) => new(s.Id, s.PageKey, s.Title, s.Description, s.OgImageUrl);
}
