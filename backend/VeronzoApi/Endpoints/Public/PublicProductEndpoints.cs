using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;
using VeronzoApi.Models.Public;

namespace VeronzoApi.Endpoints.Public;

public static class PublicProductEndpoints
{
    public static void MapPublicProductEndpoints(this WebApplication app)
    {
        app.MapGet("/api/public/products", ListAsync)
            .WithSummary("List visible products")
            .WithDescription(
                "Public, unauthenticated. Only IsVisible=true products whose category is also " +
                "IsVisible=true, ordered by SortOrder then Id. Optional ?categorySlug= filter and " +
                "optional ?lang= (ru/tg/en/fa, default ru), else falls back to the Accept-Language header, " +
                "with ru-then-legacy-field fallback. When ?categorySlug= is given, any other query key " +
                "matching that category's filterable attribute Keys narrows the results (multiple values " +
                "for the same key = OR, different keys = AND); unrecognized keys are ignored.")
            .Produces<PublicProductResponse[]>(StatusCodes.Status200OK)
            .CacheOutput("PublicProductsContent");

        app.MapGet("/api/public/products/{id:int}", GetByIdAsync)
            .WithSummary("Get a single visible product with images and attributes")
            .WithDescription(
                "Public, unauthenticated. 404 if the product doesn't exist or either the product or its " +
                "category has IsVisible=false. Images: the legacy Product.ImageUrl first (if set), then " +
                "any additional ProductImage rows ordered by SortOrder. Attributes: only IsVisible=true " +
                "definitions with a value set on this product, Name/Value already language-resolved the " +
                "same way as the list endpoint.")
            .Produces<PublicProductDetailResponse>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .CacheOutput("PublicContent");
    }

    private static readonly HashSet<string> ReservedQueryKeys = new(StringComparer.OrdinalIgnoreCase) { "categorySlug", "lang" };

    private static async Task<IResult> ListAsync(
        string? categorySlug, string? lang, AppDbContext db, HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var language = PublicTranslationHelpers.ResolveLanguage(lang, httpContext);

        // A product in a hidden category (e.g. "windows" before the owner supplies
        // real copy/photos) must stay hidden too, even though Product.IsVisible
        // itself might be true — the join enforces that without needing a second
        // round trip.
        var query =
            from p in db.Products.AsNoTracking()
            join c in db.Categories.AsNoTracking() on p.CategoryId equals c.Id
            where p.IsVisible && c.IsVisible
            select new { Product = p, Category = c };

        if (!string.IsNullOrWhiteSpace(categorySlug))
        {
            query = query.Where(x => x.Category.Slug == categorySlug);

            // Attribute filter keys are only meaningful within a resolved category
            // (Key is unique per-category, not globally) -- without a categorySlug,
            // any extra query keys are silently ignored rather than guessed at.
            var categoryId = await db.Categories.AsNoTracking()
                .Where(c => c.Slug == categorySlug)
                .Select(c => (int?)c.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (categoryId is not null)
            {
                var filterableDefinitions = await db.ProductAttributeDefinitions.AsNoTracking()
                    .Where(d => d.CategoryId == categoryId.Value && d.IsFilterable)
                    .ToDictionaryAsync(d => d.Key, d => d.Id, StringComparer.OrdinalIgnoreCase, cancellationToken);

                foreach (var queryKey in httpContext.Request.Query.Keys)
                {
                    // Never build SQL/LINQ from a raw string -- only a key that matches an
                    // admin-defined, filterable definition for this category is used; every
                    // other key (including the reserved ones above) is dropped here.
                    if (ReservedQueryKeys.Contains(queryKey) || !filterableDefinitions.TryGetValue(queryKey, out var definitionId))
                    {
                        continue;
                    }

                    var values = httpContext.Request.Query[queryKey]
                        .Where(v => !string.IsNullOrWhiteSpace(v)).Select(v => v!).ToArray();
                    if (values.Length == 0)
                    {
                        continue;
                    }

                    query = query.Where(x => db.ProductAttributeValues.Any(v =>
                        v.ProductId == x.Product.Id && v.DefinitionId == definitionId &&
                        ((v.OptionId != null && v.Option != null && values.Contains(v.Option.Value)) ||
                         (v.TextValue != null && values.Contains(v.TextValue)))));
                }
            }
        }

        var raw = await query
            .OrderBy(x => x.Product.SortOrder).ThenBy(x => x.Product.Id)
            .Select(x => new
            {
                x.Product.Id,
                x.Product.CategoryId,
                x.Product.Title,
                x.Product.Description,
                x.Product.BadgeText,
                x.Product.ImageUrl,
                x.Product.SortOrder,
                Requested = x.Product.Translations.FirstOrDefault(t => t.LanguageCode == language),
                Ru = x.Product.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default)
            })
            .ToListAsync(cancellationToken);

        var items = raw.Select(x => new PublicProductResponse(
            x.Id, x.CategoryId,
            PublicTranslationHelpers.Pick(x.Requested?.Title, x.Ru?.Title, x.Title),
            PublicTranslationHelpers.PickNullable(x.Requested?.Description, x.Ru?.Description, x.Description),
            PublicTranslationHelpers.PickNullable(x.Requested?.BadgeText, x.Ru?.BadgeText, x.BadgeText),
            x.ImageUrl, x.SortOrder));

        return Results.Ok(items);
    }

    private static async Task<IResult> GetByIdAsync(
        int id, string? lang, AppDbContext db, HttpContext httpContext, CancellationToken cancellationToken)
    {
        var language = PublicTranslationHelpers.ResolveLanguage(lang, httpContext);

        var raw = await (
            from p in db.Products.AsNoTracking()
            join c in db.Categories.AsNoTracking() on p.CategoryId equals c.Id
            where p.Id == id && p.IsVisible && c.IsVisible
            select new
            {
                p.Id,
                p.CategoryId,
                CategorySlug = c.Slug,
                p.Title,
                p.Description,
                p.BadgeText,
                p.ImageUrl,
                p.SortOrder,
                Requested = p.Translations.FirstOrDefault(t => t.LanguageCode == language),
                Ru = p.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default),
                ImageRows = p.Images.OrderBy(i => i.SortOrder).Select(i => new { i.ImageUrl, i.SortOrder }).ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (raw is null)
        {
            return Results.NotFound(new ApiErrorResponse("Product not found"));
        }

        var images = new List<PublicProductImageResponse>();
        if (!string.IsNullOrWhiteSpace(raw.ImageUrl))
        {
            // Sentinel sort position so the legacy cover image always leads,
            // regardless of whatever SortOrder values admin assigns the rest.
            images.Add(new PublicProductImageResponse(raw.ImageUrl, -1));
        }
        images.AddRange(raw.ImageRows.Select(i => new PublicProductImageResponse(i.ImageUrl, i.SortOrder)));

        var attributeRows = await (
            from v in db.ProductAttributeValues.AsNoTracking()
            join d in db.ProductAttributeDefinitions.AsNoTracking() on v.DefinitionId equals d.Id
            where v.ProductId == id && d.IsVisible
            orderby d.SortOrder
            select new
            {
                d.Key,
                DefinitionName = d.Name,
                DefinitionRequested = d.Translations.FirstOrDefault(t => t.LanguageCode == language),
                DefinitionRu = d.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default),
                v.TextValue,
                OptionLabel = v.Option != null ? v.Option.Label : null,
                OptionRequested = v.Option != null ? v.Option.Translations.FirstOrDefault(t => t.LanguageCode == language) : null,
                OptionRu = v.Option != null ? v.Option.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default) : null
            })
            .ToListAsync(cancellationToken);

        var attributes = attributeRows
            .Select(a => new PublicProductDetailAttributeResponse(
                a.Key,
                PublicTranslationHelpers.Pick(a.DefinitionRequested?.Name, a.DefinitionRu?.Name, a.DefinitionName),
                a.OptionLabel is not null
                    ? PublicTranslationHelpers.Pick(a.OptionRequested?.Label, a.OptionRu?.Label, a.OptionLabel)
                    : a.TextValue ?? string.Empty))
            .Where(a => !string.IsNullOrWhiteSpace(a.Value))
            .ToArray();

        var response = new PublicProductDetailResponse(
            raw.Id,
            raw.CategoryId,
            raw.CategorySlug,
            PublicTranslationHelpers.Pick(raw.Requested?.Title, raw.Ru?.Title, raw.Title),
            PublicTranslationHelpers.PickNullable(raw.Requested?.Description, raw.Ru?.Description, raw.Description),
            PublicTranslationHelpers.PickNullable(raw.Requested?.BadgeText, raw.Ru?.BadgeText, raw.BadgeText),
            raw.SortOrder,
            images.ToArray(),
            attributes);

        return Results.Ok(response);
    }
}
