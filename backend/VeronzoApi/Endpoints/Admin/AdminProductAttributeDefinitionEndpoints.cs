using System.Security.Claims;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminProductAttributeDefinitionEndpoints
{
    private static readonly IReadOnlyDictionary<string, Func<ProductAttributeDefinition, IComparable>> SortWhitelist =
        new Dictionary<string, Func<ProductAttributeDefinition, IComparable>>
        {
            ["id"] = d => d.Id,
            ["key"] = d => d.Key,
            ["name"] = d => d.Name,
            ["sortOrder"] = d => d.SortOrder,
            ["categoryId"] = d => d.CategoryId
        };

    public static void MapAdminProductAttributeDefinitionEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/product-attribute-definitions").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync)
            .WithSummary("List product attribute definitions")
            .WithDescription("Paginated, searchable (key/name) and sortable list. Supports filtering by categoryId.")
            .Produces<PagedResult<ProductAttributeDefinitionResponse>>(StatusCodes.Status200OK)
            .WithAdminAuthResponses();

        group.MapGet("/{id:int}", GetByIdAsync)
            .WithSummary("Get product attribute definition by id")
            .Produces<ProductAttributeDefinitionResponse>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();

        group.MapPost("", CreateAsync)
            .WithSummary("Create product attribute definition")
            .WithDescription("CategoryId must reference an existing category. Key must be unique within the category.")
            .Produces<ProductAttributeDefinitionResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
            .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict)
            .WithAdminAuthResponses();

        group.MapPut("/{id:int}", UpdateAsync)
            .WithSummary("Update product attribute definition")
            .Produces<ProductAttributeDefinitionResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict)
            .WithAdminAuthResponses();

        group.MapDelete("/{id:int}", DeleteAsync)
            .WithSummary("Delete product attribute definition")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict)
            .WithAdminAuthResponses();
    }

    private static async Task<IResult> ListAsync(
        int? page, int? pageSize, string? search, string? sort, int? categoryId,
        AppDbContext db, CancellationToken cancellationToken)
    {
        var (p, ps) = AdminEndpointHelpers.NormalizePaging(page, pageSize);
        var definitions = await db.ProductAttributeDefinitions.ToListAsync(cancellationToken);

        IEnumerable<ProductAttributeDefinition> filtered = definitions;
        if (categoryId is not null)
        {
            filtered = filtered.Where(x => x.CategoryId == categoryId.Value);
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            filtered = filtered.Where(x =>
                x.Key.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                x.Name.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        var ordered = AdminEndpointHelpers.ApplySort(filtered, sort, SortWhitelist, "sortOrder").ThenBy(x => x.Id);
        return Results.Ok(AdminEndpointHelpers.Paginate(ordered, p, ps, ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var definition = await db.ProductAttributeDefinitions.FindAsync(new object[] { id }, cancellationToken);
        return definition is null ? Results.NotFound(new ApiErrorResponse("Product attribute definition not found")) : Results.Ok(ToResponse(definition));
    }

    private static async Task<IResult> CreateAsync(
        ProductAttributeDefinitionRequest request, IValidator<ProductAttributeDefinitionRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        if (!await db.Categories.AnyAsync(c => c.Id == request.CategoryId, cancellationToken))
        {
            return Results.BadRequest(new ApiErrorResponse("CategoryId does not exist"));
        }

        var definition = new ProductAttributeDefinition
        {
            CategoryId = request.CategoryId,
            Key = request.Key,
            Name = request.Name,
            SortOrder = request.SortOrder,
            IsFilterable = request.IsFilterable,
            IsVisible = request.IsVisible
        };
        db.ProductAttributeDefinitions.Add(definition);
        await AdminTranslationSync.SyncProductAttributeDefinitionAsync(db, definition, isNew: true, cancellationToken);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Create", nameof(ProductAttributeDefinition), definition.Id);
        return Results.Created($"/api/admin/product-attribute-definitions/{definition.Id}", ToResponse(definition));
    }

    private static async Task<IResult> UpdateAsync(
        int id, ProductAttributeDefinitionRequest request, IValidator<ProductAttributeDefinitionRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var definition = await db.ProductAttributeDefinitions.FindAsync(new object[] { id }, cancellationToken);
        if (definition is null)
        {
            return Results.NotFound(new ApiErrorResponse("Product attribute definition not found"));
        }

        if (!await db.Categories.AnyAsync(c => c.Id == request.CategoryId, cancellationToken))
        {
            return Results.BadRequest(new ApiErrorResponse("CategoryId does not exist"));
        }

        definition.CategoryId = request.CategoryId;
        definition.Key = request.Key;
        definition.Name = request.Name;
        definition.SortOrder = request.SortOrder;
        definition.IsFilterable = request.IsFilterable;
        definition.IsVisible = request.IsVisible;
        await AdminTranslationSync.SyncProductAttributeDefinitionAsync(db, definition, isNew: false, cancellationToken);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Update", nameof(ProductAttributeDefinition), definition.Id);
        return Results.Ok(ToResponse(definition));
    }

    private static async Task<IResult> DeleteAsync(
        int id, AppDbContext db, ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var definition = await db.ProductAttributeDefinitions.FindAsync(new object[] { id }, cancellationToken);
        if (definition is null)
        {
            return Results.NotFound(new ApiErrorResponse("Product attribute definition not found"));
        }

        if (await db.ProductAttributeOptions.AnyAsync(o => o.DefinitionId == id, cancellationToken) ||
            await db.ProductAttributeValues.AnyAsync(v => v.DefinitionId == id, cancellationToken))
        {
            return Results.Conflict(new ApiErrorResponse("Cannot delete a definition that still has options or values"));
        }

        db.ProductAttributeDefinitions.Remove(definition);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Delete", nameof(ProductAttributeDefinition), id);
        return Results.NoContent();
    }

    private static ProductAttributeDefinitionResponse ToResponse(ProductAttributeDefinition d) =>
        new(d.Id, d.CategoryId, d.Key, d.Name, d.SortOrder, d.IsFilterable, d.IsVisible);
}
