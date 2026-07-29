using System.Security.Claims;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

public static class AdminProductAttributeValueEndpoints
{
    private static readonly IReadOnlyDictionary<string, Func<ProductAttributeValue, IComparable>> SortWhitelist =
        new Dictionary<string, Func<ProductAttributeValue, IComparable>>
        {
            ["id"] = v => v.Id,
            ["productId"] = v => v.ProductId,
            ["definitionId"] = v => v.DefinitionId
        };

    public static void MapAdminProductAttributeValueEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/product-attribute-values").RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync)
            .WithSummary("List product attribute values")
            .WithDescription("Paginated, sortable list. Supports filtering by productId and/or definitionId.")
            .Produces<PagedResult<ProductAttributeValueResponse>>(StatusCodes.Status200OK)
            .WithAdminAuthResponses();

        group.MapGet("/{id:int}", GetByIdAsync)
            .WithSummary("Get product attribute value by id")
            .Produces<ProductAttributeValueResponse>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();

        group.MapPost("", CreateAsync)
            .WithSummary("Create product attribute value")
            .WithDescription("ProductId and DefinitionId must exist; a product can only have one value per definition. If OptionId is set it must belong to DefinitionId.")
            .Produces<ProductAttributeValueResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
            .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict)
            .WithAdminAuthResponses();

        group.MapPut("/{id:int}", UpdateAsync)
            .WithSummary("Update product attribute value")
            .Produces<ProductAttributeValueResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict)
            .WithAdminAuthResponses();

        group.MapDelete("/{id:int}", DeleteAsync)
            .WithSummary("Delete product attribute value")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();
    }

    private static async Task<IResult> ListAsync(
        int? page, int? pageSize, string? sort, int? productId, int? definitionId,
        AppDbContext db, CancellationToken cancellationToken)
    {
        var (p, ps) = AdminEndpointHelpers.NormalizePaging(page, pageSize);
        var values = await db.ProductAttributeValues.ToListAsync(cancellationToken);

        IEnumerable<ProductAttributeValue> filtered = values;
        if (productId is not null)
        {
            filtered = filtered.Where(x => x.ProductId == productId.Value);
        }
        if (definitionId is not null)
        {
            filtered = filtered.Where(x => x.DefinitionId == definitionId.Value);
        }

        var ordered = AdminEndpointHelpers.ApplySort(filtered, sort, SortWhitelist, "id");
        return Results.Ok(AdminEndpointHelpers.Paginate(ordered, p, ps, ToResponse));
    }

    private static async Task<IResult> GetByIdAsync(int id, AppDbContext db, CancellationToken cancellationToken)
    {
        var value = await db.ProductAttributeValues.FindAsync(new object[] { id }, cancellationToken);
        return value is null ? Results.NotFound(new ApiErrorResponse("Product attribute value not found")) : Results.Ok(ToResponse(value));
    }

    private static async Task<IResult?> ValidateCrossReferencesAsync(
        ProductAttributeValueRequest request, AppDbContext db, CancellationToken cancellationToken)
    {
        if (!await db.Products.AnyAsync(x => x.Id == request.ProductId, cancellationToken))
        {
            return Results.BadRequest(new ApiErrorResponse("ProductId does not exist"));
        }
        if (!await db.ProductAttributeDefinitions.AnyAsync(x => x.Id == request.DefinitionId, cancellationToken))
        {
            return Results.BadRequest(new ApiErrorResponse("DefinitionId does not exist"));
        }
        if (request.OptionId is not null &&
            !await db.ProductAttributeOptions.AnyAsync(x => x.Id == request.OptionId && x.DefinitionId == request.DefinitionId, cancellationToken))
        {
            return Results.BadRequest(new ApiErrorResponse("OptionId does not belong to DefinitionId"));
        }
        return null;
    }

    private static async Task<IResult> CreateAsync(
        ProductAttributeValueRequest request, IValidator<ProductAttributeValueRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var crossRefResult = await ValidateCrossReferencesAsync(request, db, cancellationToken);
        if (crossRefResult is not null)
        {
            return crossRefResult;
        }

        var value = new ProductAttributeValue
        {
            ProductId = request.ProductId,
            DefinitionId = request.DefinitionId,
            OptionId = request.OptionId,
            TextValue = request.TextValue
        };
        db.ProductAttributeValues.Add(value);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Create", nameof(ProductAttributeValue), value.Id);
        return Results.Created($"/api/admin/product-attribute-values/{value.Id}", ToResponse(value));
    }

    private static async Task<IResult> UpdateAsync(
        int id, ProductAttributeValueRequest request, IValidator<ProductAttributeValueRequest> validator, AppDbContext db,
        ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var value = await db.ProductAttributeValues.FindAsync(new object[] { id }, cancellationToken);
        if (value is null)
        {
            return Results.NotFound(new ApiErrorResponse("Product attribute value not found"));
        }

        var crossRefResult = await ValidateCrossReferencesAsync(request, db, cancellationToken);
        if (crossRefResult is not null)
        {
            return crossRefResult;
        }

        value.ProductId = request.ProductId;
        value.DefinitionId = request.DefinitionId;
        value.OptionId = request.OptionId;
        value.TextValue = request.TextValue;

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Update", nameof(ProductAttributeValue), value.Id);
        return Results.Ok(ToResponse(value));
    }

    private static async Task<IResult> DeleteAsync(
        int id, AppDbContext db, ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        var value = await db.ProductAttributeValues.FindAsync(new object[] { id }, cancellationToken);
        if (value is null)
        {
            return Results.NotFound(new ApiErrorResponse("Product attribute value not found"));
        }

        db.ProductAttributeValues.Remove(value);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, "Delete", nameof(ProductAttributeValue), id);
        return Results.NoContent();
    }

    private static ProductAttributeValueResponse ToResponse(ProductAttributeValue v) =>
        new(v.Id, v.ProductId, v.DefinitionId, v.OptionId, v.TextValue);
}
