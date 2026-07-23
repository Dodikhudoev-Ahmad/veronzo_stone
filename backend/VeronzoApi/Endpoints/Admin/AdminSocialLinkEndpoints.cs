using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminSocialLinkEndpoints
{
    public static void MapAdminSocialLinkEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/social-links").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync);
        group.MapGet("/{id:int}", GetByIdAsync);
        group.MapPost("", CreateAsync);
        group.MapPut("/{id:int}", UpdateAsync);
        group.MapDelete("/{id:int}", DeleteAsync);
    }

    // SocialLink has no SortOrder field — ordered by Id only.
    private static async Task<IResult> ListAsync(AppDbContext db, CancellationToken cancellationToken)
    {
        var items = await db.SocialLinks.OrderBy(s => s.Id).ToListAsync(cancellationToken);
        return Results.Ok(items.Select(ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var item = await db.SocialLinks.FindAsync(new object[] { id }, cancellationToken);
        return item is null ? Results.NotFound(new { error = "Social link not found" }) : Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> CreateAsync(
        SocialLinkRequest request, IValidator<SocialLinkRequest> validator, AppDbContext db, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var item = new SocialLink { Platform = request.Platform, Url = request.Url, IsVisible = request.IsVisible };
        db.SocialLinks.Add(item);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        return Results.Created($"/api/admin/social-links/{item.Id}", ToResponse(item));
    }

    private static async Task<IResult> UpdateAsync(
        int id, SocialLinkRequest request, IValidator<SocialLinkRequest> validator, AppDbContext db, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var item = await db.SocialLinks.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new { error = "Social link not found" });
        }

        item.Platform = request.Platform;
        item.Url = request.Url;
        item.IsVisible = request.IsVisible;

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        return Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> DeleteAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var item = await db.SocialLinks.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new { error = "Social link not found" });
        }

        db.SocialLinks.Remove(item);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        return Results.NoContent();
    }

    private static SocialLinkResponse ToResponse(SocialLink s) => new(s.Id, s.Platform, s.Url, s.IsVisible);
}
