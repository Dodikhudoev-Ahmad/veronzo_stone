using System.Security.Claims;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminSocialLinkEndpoints
{
    private static readonly IReadOnlyDictionary<string, Func<SocialLink, IComparable>> SortWhitelist =
        new Dictionary<string, Func<SocialLink, IComparable>>
        {
            ["id"] = s => s.Id,
            ["platform"] = s => s.Platform
        };

    public static void MapAdminSocialLinkEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/social-links").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync)
            .WithSummary("List social links")
            .WithDescription("Paginated, sortable list of social links. Supports filtering by enabled.")
            .Produces<PagedResult<SocialLinkResponse>>(StatusCodes.Status200OK)
            .WithAdminAuthResponses();

        group.MapGet("/{id:int}", GetByIdAsync)
            .WithSummary("Get social link by id")
            .Produces<SocialLinkResponse>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();

        group.MapPost("", CreateAsync)
            .WithSummary("Create social link")
            .Produces<SocialLinkResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .WithAdminAuthResponses();

        group.MapPut("/{id:int}", UpdateAsync)
            .WithSummary("Update social link")
            .Produces<SocialLinkResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();

        group.MapDelete("/{id:int}", DeleteAsync)
            .WithSummary("Delete social link")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();
    }

    private static async Task<IResult> ListAsync(
        int? page, int? pageSize, string? sort, bool? enabled, AppDbContext db, CancellationToken cancellationToken)
    {
        var (p, ps) = AdminEndpointHelpers.NormalizePaging(page, pageSize);
        var items = await db.SocialLinks.ToListAsync(cancellationToken);

        IEnumerable<SocialLink> filtered = items;
        if (enabled is not null)
        {
            filtered = filtered.Where(x => x.IsVisible == enabled.Value);
        }

        var ordered = AdminEndpointHelpers.ApplySort(filtered, sort, SortWhitelist, "id").ThenBy(x => x.Id);
        return Results.Ok(AdminEndpointHelpers.Paginate(ordered, p, ps, ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var item = await db.SocialLinks.FindAsync(new object[] { id }, cancellationToken);
        return item is null ? Results.NotFound(new ApiErrorResponse("Social link not found")) : Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> CreateAsync(
        SocialLinkRequest request, IValidator<SocialLinkRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
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

        AdminEndpointHelpers.LogAudit(logger, user, "Create", nameof(SocialLink), item.Id);
        return Results.Created($"/api/admin/social-links/{item.Id}", ToResponse(item));
    }

    private static async Task<IResult> UpdateAsync(
        int id, SocialLinkRequest request, IValidator<SocialLinkRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var item = await db.SocialLinks.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new ApiErrorResponse("Social link not found"));
        }

        item.Platform = request.Platform;
        item.Url = request.Url;
        item.IsVisible = request.IsVisible;

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Update", nameof(SocialLink), item.Id);
        return Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> DeleteAsync(
        int id, AppDbContext db, ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var item = await db.SocialLinks.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new ApiErrorResponse("Social link not found"));
        }

        db.SocialLinks.Remove(item);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Delete", nameof(SocialLink), id);
        return Results.NoContent();
    }

    private static SocialLinkResponse ToResponse(SocialLink s) => new(s.Id, s.Platform, s.Url, s.IsVisible);
}
