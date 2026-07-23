using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminHeroStatEndpoints
{
    public static void MapAdminHeroStatEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/hero-stats").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync);
        group.MapGet("/{id:int}", GetByIdAsync);
        group.MapPost("", CreateAsync);
        group.MapPut("/{id:int}", UpdateAsync);
        group.MapDelete("/{id:int}", DeleteAsync);
    }

    private static async Task<IResult> ListAsync(AppDbContext db, CancellationToken cancellationToken)
    {
        var stats = await db.HeroStats
            .OrderBy(h => h.SortOrder).ThenBy(h => h.Id)
            .ToListAsync(cancellationToken);
        return Results.Ok(stats.Select(ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var stat = await db.HeroStats.FindAsync(new object[] { id }, cancellationToken);
        return stat is null ? Results.NotFound(new { error = "Hero stat not found" }) : Results.Ok(ToResponse(stat));
    }

    private static async Task<IResult> CreateAsync(
        HeroStatRequest request, IValidator<HeroStatRequest> validator, AppDbContext db, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var stat = new HeroStat
        {
            Label = request.Label,
            Value = request.Value,
            Suffix = request.Suffix,
            SortOrder = request.SortOrder
        };
        db.HeroStats.Add(stat);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        return Results.Created($"/api/admin/hero-stats/{stat.Id}", ToResponse(stat));
    }

    private static async Task<IResult> UpdateAsync(
        int id, HeroStatRequest request, IValidator<HeroStatRequest> validator, AppDbContext db, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var stat = await db.HeroStats.FindAsync(new object[] { id }, cancellationToken);
        if (stat is null)
        {
            return Results.NotFound(new { error = "Hero stat not found" });
        }

        stat.Label = request.Label;
        stat.Value = request.Value;
        stat.Suffix = request.Suffix;
        stat.SortOrder = request.SortOrder;

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        return Results.Ok(ToResponse(stat));
    }

    private static async Task<IResult> DeleteAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var stat = await db.HeroStats.FindAsync(new object[] { id }, cancellationToken);
        if (stat is null)
        {
            return Results.NotFound(new { error = "Hero stat not found" });
        }

        db.HeroStats.Remove(stat);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        return Results.NoContent();
    }

    private static HeroStatResponse ToResponse(HeroStat h) => new(h.Id, h.Label, h.Value, h.Suffix, h.SortOrder);
}
