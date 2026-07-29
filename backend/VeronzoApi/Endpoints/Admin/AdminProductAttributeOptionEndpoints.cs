using System.Security.Claims;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminProductAttributeOptionEndpoints
{
    private static readonly IReadOnlyDictionary<string, Func<ProductAttributeOption, IComparable>> SortWhitelist =
        new Dictionary<string, Func<ProductAttributeOption, IComparable>>
        {
            ["id"] = o => o.Id,
            ["value"] = o => o.Value,
            ["label"] = o => o.Label,
            ["sortOrder"] = o => o.SortOrder,
            ["definitionId"] = o => o.DefinitionId
        };

    public static void MapAdminProductAttributeOptionEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/product-attribute-options").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync)
            .WithSummary("List product attribute options")
            .WithDescription("Paginated, searchable (value/label) and sortable list. Supports filtering by definitionId.")
            .Produces<PagedResult<ProductAttributeOptionResponse>>(StatusCodes.Status200OK)
            .WithAdminAuthResponses();

        group.MapGet("/{id:int}", GetByIdAsync)
            .WithSummary("Get product attribute option by id")
            .Produces<ProductAttributeOptionResponse>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();

        group.MapPost("", CreateAsync)
            .WithSummary("Create product attribute option")
            .WithDescription("DefinitionId must reference an existing attribute definition. Value must be unique within the definition.")
            .Produces<ProductAttributeOptionResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
            .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict)
            .WithAdminAuthResponses();

        group.MapPut("/{id:int}", UpdateAsync)
            .WithSummary("Update product attribute option")
            .Produces<ProductAttributeOptionResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict)
            .WithAdminAuthResponses();

        group.MapDelete("/{id:int}", DeleteAsync)
            .WithSummary("Delete product attribute option")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict)
            .WithAdminAuthResponses();
    }

    private static async Task<IResult> ListAsync(
        int? page, int? pageSize, string? search, string? sort, int? definitionId,
        AppDbContext db, CancellationToken cancellationToken)
    {
        var (p, ps) = AdminEndpointHelpers.NormalizePaging(page, pageSize);
        var options = await db.ProductAttributeOptions.ToListAsync(cancellationToken);

        IEnumerable<ProductAttributeOption> filtered = options;
        if (definitionId is not null)
        {
            filtered = filtered.Where(x => x.DefinitionId == definitionId.Value);
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            filtered = filtered.Where(x =>
                x.Value.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                x.Label.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        var ordered = AdminEndpointHelpers.ApplySort(filtered, sort, SortWhitelist, "sortOrder").ThenBy(x => x.Id);
        return Results.Ok(AdminEndpointHelpers.Paginate(ordered, p, ps, ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var option = await db.ProductAttributeOptions.FindAsync(new object[] { id }, cancellationToken);
        return option is null ? Results.NotFound(new ApiErrorResponse("Product attribute option not found")) : Results.Ok(ToResponse(option));
    }

    private static async Task<IResult> CreateAsync(
        ProductAttributeOptionRequest request, IValidator<ProductAttributeOptionRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        if (!await db.ProductAttributeDefinitions.AnyAsync(d => d.Id == request.DefinitionId, cancellationToken))
        {
            return Results.BadRequest(new ApiErrorResponse("DefinitionId does not exist"));
        }

        var option = new ProductAttributeOption
        {
            DefinitionId = request.DefinitionId,
            Value = request.Value,
            Label = request.Label,
            SortOrder = request.SortOrder,
            IsVisible = request.IsVisible
        };
        db.ProductAttributeOptions.Add(option);
        await AdminTranslationSync.SyncProductAttributeOptionAsync(db, option, isNew: true, cancellationToken);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Create", nameof(ProductAttributeOption), option.Id);
        return Results.Created($"/api/admin/product-attribute-options/{option.Id}", ToResponse(option));
    }

    private static async Task<IResult> UpdateAsync(
        int id, ProductAttributeOptionRequest request, IValidator<ProductAttributeOptionRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var option = await db.ProductAttributeOptions.FindAsync(new object[] { id }, cancellationToken);
        if (option is null)
        {
            return Results.NotFound(new ApiErrorResponse("Product attribute option not found"));
        }

        if (!await db.ProductAttributeDefinitions.AnyAsync(d => d.Id == request.DefinitionId, cancellationToken))
        {
            return Results.BadRequest(new ApiErrorResponse("DefinitionId does not exist"));
        }

        option.DefinitionId = request.DefinitionId;
        option.Value = request.Value;
        option.Label = request.Label;
        option.SortOrder = request.SortOrder;
        option.IsVisible = request.IsVisible;
        await AdminTranslationSync.SyncProductAttributeOptionAsync(db, option, isNew: false, cancellationToken);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Update", nameof(ProductAttributeOption), option.Id);
        return Results.Ok(ToResponse(option));
    }

    private static async Task<IResult> DeleteAsync(
        int id, AppDbContext db, ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var option = await db.ProductAttributeOptions.FindAsync(new object[] { id }, cancellationToken);
        if (option is null)
        {
            return Results.NotFound(new ApiErrorResponse("Product attribute option not found"));
        }

        if (await db.ProductAttributeValues.AnyAsync(v => v.OptionId == id, cancellationToken))
        {
            return Results.Conflict(new ApiErrorResponse("Cannot delete an option that is still used by product attribute values"));
        }

        db.ProductAttributeOptions.Remove(option);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Delete", nameof(ProductAttributeOption), id);
        return Results.NoContent();
    }

    private static ProductAttributeOptionResponse ToResponse(ProductAttributeOption o) =>
        new(o.Id, o.DefinitionId, o.Value, o.Label, o.SortOrder, o.IsVisible);
}
