using System.Security.Claims;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminContactInfoEndpoints
{
    private static readonly IReadOnlyDictionary<string, Func<ContactInfo, IComparable>> SortWhitelist =
        new Dictionary<string, Func<ContactInfo, IComparable>>
        {
            ["id"] = c => c.Id,
            ["label"] = c => c.Label,
            ["sortOrder"] = c => c.SortOrder
        };

    public static void MapAdminContactInfoEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/contact-info").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync)
            .WithSummary("List contact info entries")
            .WithDescription("Paginated, sortable list of published contact details (showroom, phone, email, etc.).")
            .Produces<PagedResult<ContactInfoResponse>>(StatusCodes.Status200OK)
            .WithAdminAuthResponses();

        group.MapGet("/{id:int}", GetByIdAsync)
            .WithSummary("Get contact info entry by id")
            .Produces<ContactInfoResponse>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();

        group.MapPost("", CreateAsync)
            .WithSummary("Create contact info entry")
            .Produces<ContactInfoResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .WithAdminAuthResponses();

        group.MapPut("/{id:int}", UpdateAsync)
            .WithSummary("Update contact info entry")
            .Produces<ContactInfoResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();

        group.MapDelete("/{id:int}", DeleteAsync)
            .WithSummary("Delete contact info entry")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();
    }

    private static async Task<IResult> ListAsync(
        int? page, int? pageSize, string? sort, AppDbContext db, CancellationToken cancellationToken)
    {
        var (p, ps) = AdminEndpointHelpers.NormalizePaging(page, pageSize);
        var items = await db.ContactInfos.ToListAsync(cancellationToken);

        var ordered = AdminEndpointHelpers.ApplySort(items, sort, SortWhitelist, "sortOrder").ThenBy(x => x.Id);
        return Results.Ok(AdminEndpointHelpers.Paginate(ordered, p, ps, ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var item = await db.ContactInfos.FindAsync(new object[] { id }, cancellationToken);
        return item is null ? Results.NotFound(new ApiErrorResponse("Contact info not found")) : Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> CreateAsync(
        ContactInfoRequest request, IValidator<ContactInfoRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
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

        AdminEndpointHelpers.LogAudit(logger, user, "Create", nameof(ContactInfo), item.Id);
        return Results.Created($"/api/admin/contact-info/{item.Id}", ToResponse(item));
    }

    private static async Task<IResult> UpdateAsync(
        int id, ContactInfoRequest request, IValidator<ContactInfoRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var item = await db.ContactInfos.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new ApiErrorResponse("Contact info not found"));
        }

        item.Label = request.Label;
        item.Value = request.Value;
        item.SortOrder = request.SortOrder;

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Update", nameof(ContactInfo), item.Id);
        return Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> DeleteAsync(
        int id, AppDbContext db, ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var item = await db.ContactInfos.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new ApiErrorResponse("Contact info not found"));
        }

        db.ContactInfos.Remove(item);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Delete", nameof(ContactInfo), id);
        return Results.NoContent();
    }

    private static ContactInfoResponse ToResponse(ContactInfo c) => new(c.Id, c.Label, c.Value, c.SortOrder);
}
