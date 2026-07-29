using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;
using VeronzoApi.Models.Public;

namespace VeronzoApi.Endpoints.Public;

public static class PublicProductAttributeEndpoints
{
    public static void MapPublicProductAttributeEndpoints(this WebApplication app)
    {
        app.MapGet("/api/public/product-attributes", ListAsync)
            .WithSummary("List filterable attribute definitions for a category")
            .WithDescription(
                "Public, unauthenticated. Requires ?categorySlug=. Only IsFilterable=true and " +
                "IsVisible=true definitions/options are returned, ordered by SortOrder. Optional " +
                "?lang= (ru/tg/en/fa, default ru), else falls back to the Accept-Language header, " +
                "with ru-then-legacy-field fallback. An unknown or hidden category returns an empty array.")
            .Produces<PublicAttributeFilterDefinitionResponse[]>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
            .CacheOutput("PublicContent");
    }

    private static async Task<IResult> ListAsync(
        string? categorySlug, string? lang, AppDbContext db, HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(categorySlug))
        {
            return Results.BadRequest(new ApiErrorResponse("categorySlug is required"));
        }

        var language = PublicTranslationHelpers.ResolveLanguage(lang, httpContext);

        var categoryId = await db.Categories
            .Where(c => c.Slug == categorySlug && c.IsVisible)
            .Select(c => (int?)c.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (categoryId is null)
        {
            return Results.Ok(Array.Empty<PublicAttributeFilterDefinitionResponse>());
        }

        var rawDefinitions = await db.ProductAttributeDefinitions.AsNoTracking()
            .Where(d => d.CategoryId == categoryId.Value && d.IsFilterable && d.IsVisible)
            .OrderBy(d => d.SortOrder).ThenBy(d => d.Id)
            .Select(d => new
            {
                d.Key,
                d.Name,
                Requested = d.Translations.FirstOrDefault(t => t.LanguageCode == language),
                Ru = d.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default),
                Options = d.Options
                    .Where(o => o.IsVisible)
                    .OrderBy(o => o.SortOrder).ThenBy(o => o.Id)
                    .Select(o => new
                    {
                        o.Value,
                        o.Label,
                        Requested = o.Translations.FirstOrDefault(t => t.LanguageCode == language),
                        Ru = o.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default)
                    })
                    .ToList()
            })
            .ToListAsync(cancellationToken);

        var result = rawDefinitions.Select(d => new PublicAttributeFilterDefinitionResponse(
            d.Key,
            PublicTranslationHelpers.Pick(d.Requested?.Name, d.Ru?.Name, d.Name),
            d.Options.Select(o => new PublicAttributeFilterOptionResponse(
                o.Value,
                PublicTranslationHelpers.Pick(o.Requested?.Label, o.Ru?.Label, o.Label))).ToArray()));

        return Results.Ok(result);
    }
}
