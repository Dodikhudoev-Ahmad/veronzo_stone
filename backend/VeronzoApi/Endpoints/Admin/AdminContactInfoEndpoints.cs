using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminContactInfoEndpoints
{
    public static void MapAdminContactInfoEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/contact-info").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync);
        group.MapGet("/{id:int}", GetByIdAsync);
        group.MapPost("", CreateAsync);
        group.MapPut("/{id:int}", UpdateAsync);
        group.MapDelete("/{id:int}", DeleteAsync);
    }

    private static async Task<IResult> ListAsync(AppDbContext db, CancellationToken cancellationToken)
    {
        var items = await db.ContactInfos
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Id)
            .ToListAsync(cancellationToken);
        return Results.Ok(items.Select(ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var item = await db.ContactInfos.FindAsync(new object[] { id }, cancellationToken);
        return item is null ? Results.NotFound(new { error = "Contact info not found" }) : Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> CreateAsync(
        ContactInfoRequest request, IValidator<ContactInfoRequest> validator, AppDbContext db, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var item = new ContactInfo { Label = request.Label, Value = request.Value, SortOrder = request.SortOrder };
        db.ContactInfos.Add(item);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        return Results.Created($"/api/admin/contact-info/{item.Id}", ToResponse(item));
    }

    private static async Task<IResult> UpdateAsync(
        int id, ContactInfoRequest request, IValidator<ContactInfoRequest> validator, AppDbContext db, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var item = await db.ContactInfos.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new { error = "Contact info not found" });
        }

        item.Label = request.Label;
        item.Value = request.Value;
        item.SortOrder = request.SortOrder;

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        return Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> DeleteAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var item = await db.ContactInfos.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new { error = "Contact info not found" });
        }

        db.ContactInfos.Remove(item);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        return Results.NoContent();
    }

    private static ContactInfoResponse ToResponse(ContactInfo c) => new(c.Id, c.Label, c.Value, c.SortOrder);
}
