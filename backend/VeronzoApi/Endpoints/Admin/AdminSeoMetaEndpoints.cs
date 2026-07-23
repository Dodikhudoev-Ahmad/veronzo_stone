using System.Security.Claims;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminSeoMetaEndpoints
{
    private static readonly IReadOnlyDictionary<string, Func<SeoMeta, IComparable>> SortWhitelist =
        new Dictionary<string, Func<SeoMeta, IComparable>>
        {
            ["id"] = s => s.Id,
            ["pageKey"] = s => s.PageKey,
            ["title"] = s => s.Title
        };

    public static void MapAdminSeoMetaEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/seo-meta").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync)
            .WithSummary("List SEO meta entries")
            .WithDescription("Paginated, sortable list of per-page SEO metadata.")
            .Produces<PagedResult<SeoMetaResponse>>(StatusCodes.Status200OK)
            .WithAdminAuthResponses();

        group.MapGet("/{id:int}", GetByIdAsync)
            .WithSummary("Get SEO meta entry by id")
            .Produces<SeoMetaResponse>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();

        group.MapPost("", CreateAsync)
            .WithSummary("Create SEO meta entry")
            .WithDescription("PageKey must be unique.")
            .Produces<SeoMetaResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict)
            .WithAdminAuthResponses();

        group.MapPut("/{id:int}", UpdateAsync)
            .WithSummary("Update SEO meta entry")
            .Produces<SeoMetaResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict)
            .WithAdminAuthResponses();

        group.MapDelete("/{id:int}", DeleteAsync)
            .WithSummary("Delete SEO meta entry")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();
    }

    private static async Task<IResult> ListAsync(
        int? page, int? pageSize, string? sort, AppDbContext db, CancellationToken cancellationToken)
    {
        var (p, ps) = AdminEndpointHelpers.NormalizePaging(page, pageSize);
        var items = await db.SeoMetas.ToListAsync(cancellationToken);

        var ordered = AdminEndpointHelpers.ApplySort(items, sort, SortWhitelist, "id").ThenBy(x => x.Id);
        return Results.Ok(AdminEndpointHelpers.Paginate(ordered, p, ps, ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var item = await db.SeoMetas.FindAsync(new object[] { id }, cancellationToken);
        return item is null ? Results.NotFound(new ApiErrorResponse("SEO meta not found")) : Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> CreateAsync(
        SeoMetaRequest request, IValidator<SeoMetaRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        if (await db.SeoMetas.AnyAsync(s => s.PageKey == request.PageKey, cancellationToken))
        {
            return Results.Conflict(new ApiErrorResponse("An SEO entry with this PageKey already exists"));
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

        AdminEndpointHelpers.LogAudit(logger, user, "Create", nameof(SeoMeta), item.Id);
        return Results.Created($"/api/admin/seo-meta/{item.Id}", ToResponse(item));
    }

    private static async Task<IResult> UpdateAsync(
        int id, SeoMetaRequest request, IValidator<SeoMetaRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var item = await db.SeoMetas.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new ApiErrorResponse("SEO meta not found"));
        }

        if (await db.SeoMetas.AnyAsync(s => s.PageKey == request.PageKey && s.Id != id, cancellationToken))
        {
            return Results.Conflict(new ApiErrorResponse("An SEO entry with this PageKey already exists"));
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

        AdminEndpointHelpers.LogAudit(logger, user, "Update", nameof(SeoMeta), item.Id);
        return Results.Ok(ToResponse(item));
    }

    private static async Task<IResult> DeleteAsync(
        int id, AppDbContext db, ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var item = await db.SeoMetas.FindAsync(new object[] { id }, cancellationToken);
        if (item is null)
        {
            return Results.NotFound(new ApiErrorResponse("SEO meta not found"));
        }

        db.SeoMetas.Remove(item);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Delete", nameof(SeoMeta), id);
        return Results.NoContent();
    }

    private static SeoMetaResponse ToResponse(SeoMeta s) => new(s.Id, s.PageKey, s.Title, s.Description, s.OgImageUrl);
}
