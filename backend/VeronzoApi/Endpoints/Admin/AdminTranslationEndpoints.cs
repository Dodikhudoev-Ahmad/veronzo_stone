using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Endpoints.Admin;

// Minimal backend prep for a future translation-management UI (Stage 15):
// one generic route pair covering all 8 translatable entities instead of 16
// near-identical typed endpoints. {entity} is a fixed slug (see ValidEntities),
// not attacker-controlled SQL/LINQ — every branch below is an explicit,
// compile-time-checked switch, same as the sort-field whitelists used
// elsewhere in the admin API.
public static class AdminTranslationEndpoints
{
    private static readonly string[] ValidEntities =
    [
        "categories", "products", "portfolio-items", "gallery-items",
        "site-content", "hero-stats", "seo-meta", "contact-info"
    ];

    public static void MapAdminTranslationEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin/{entity}/{id:int}/translations")
            .RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("", ListAsync)
            .WithSummary("List translations for an entity")
            .WithDescription("Public entity slugs: categories, products, portfolio-items, gallery-items, site-content, hero-stats, seo-meta, contact-info.")
            .Produces<TranslationResponse[]>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();

        group.MapPut("/{languageCode}", UpsertAsync)
            .WithSummary("Upsert a translation for an entity")
            .WithDescription("Creates or updates the translation row for the given language. Technical fields (ids, slugs, urls, sort order, visibility) are never part of this payload.")
            .Produces<TranslationResponse>(StatusCodes.Status200OK)
            .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
            .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
            .WithAdminAuthResponses();
    }

    private static async Task<IResult> ListAsync(string entity, int id, AppDbContext db, CancellationToken cancellationToken)
    {
        if (!ValidEntities.Contains(entity))
        {
            return Results.NotFound(new ApiErrorResponse("Unknown entity"));
        }

        if (!await ParentExistsAsync(db, entity, id, cancellationToken))
        {
            return Results.NotFound(new ApiErrorResponse($"{entity} not found"));
        }

        return Results.Ok(await ListTranslationsAsync(db, entity, id, cancellationToken));
    }

    private static async Task<IResult> UpsertAsync(
        string entity, int id, string languageCode, TranslationUpsertRequest request,
        AppDbContext db, ClaimsPrincipal user, ILogger<Program> logger, CancellationToken cancellationToken)
    {
        if (!ValidEntities.Contains(entity))
        {
            return Results.NotFound(new ApiErrorResponse("Unknown entity"));
        }

        var normalizedLang = languageCode.Trim().ToLowerInvariant();
        if (!SupportedLanguages.IsSupported(normalizedLang))
        {
            return Results.BadRequest(new ApiErrorResponse(
                $"Unsupported language code. Supported: {string.Join(", ", SupportedLanguages.All)}"));
        }

        if (!await ParentExistsAsync(db, entity, id, cancellationToken))
        {
            return Results.NotFound(new ApiErrorResponse($"{entity} not found"));
        }

        var allowedFields = AllowedFieldsFor(entity);
        var unknownField = request.Fields.Keys.FirstOrDefault(k => !allowedFields.Contains(k));
        if (unknownField is not null)
        {
            return Results.BadRequest(new ApiErrorResponse(
                $"Unknown field '{unknownField}' for entity '{entity}'. Allowed: {string.Join(", ", allowedFields)}"));
        }

        var result = await UpsertTranslationAsync(db, entity, id, normalizedLang, request.Fields, cancellationToken);

        var conflict = await AdminEndpointHelpers.TrySaveChangesAsync(db, cancellationToken);
        if (conflict is not null)
        {
            return conflict;
        }

        AdminEndpointHelpers.LogAudit(logger, user, $"UpsertTranslation:{normalizedLang}", entity, id);
        return Results.Ok(result);
    }

    private static string[] AllowedFieldsFor(string entity) => entity switch
    {
        "categories" => ["Name", "Description"],
        "products" => ["Title", "Description", "BadgeText"],
        "portfolio-items" => ["Title", "Meta", "CategoryTag"],
        "gallery-items" => ["Title", "AltText"],
        "site-content" => ["Value"],
        "hero-stats" => ["Label"],
        "seo-meta" => ["Title", "Description", "Keywords", "OgTitle", "OgDescription"],
        "contact-info" => ["Label"],
        _ => []
    };

    private static Task<bool> ParentExistsAsync(AppDbContext db, string entity, int id, CancellationToken ct) => entity switch
    {
        "categories" => db.Categories.AnyAsync(x => x.Id == id, ct),
        "products" => db.Products.AnyAsync(x => x.Id == id, ct),
        "portfolio-items" => db.PortfolioItems.AnyAsync(x => x.Id == id, ct),
        "gallery-items" => db.GalleryItems.AnyAsync(x => x.Id == id, ct),
        "site-content" => db.SiteContents.AnyAsync(x => x.Id == id, ct),
        "hero-stats" => db.HeroStats.AnyAsync(x => x.Id == id, ct),
        "seo-meta" => db.SeoMetas.AnyAsync(x => x.Id == id, ct),
        "contact-info" => db.ContactInfos.AnyAsync(x => x.Id == id, ct),
        _ => Task.FromResult(false)
    };

    // EF's query-translation Select() can't build a Dictionary initializer inside
    // the expression tree, so each branch first projects a flat, translatable
    // shape and only assembles the Dictionary afterwards, in memory.
    private static async Task<TranslationResponse[]> ListTranslationsAsync(AppDbContext db, string entity, int id, CancellationToken ct)
    {
        switch (entity)
        {
            case "categories":
            {
                var rows = await db.CategoryTranslations.AsNoTracking().Where(t => t.CategoryId == id)
                    .Select(t => new { t.LanguageCode, t.Name, t.Description }).ToArrayAsync(ct);
                return rows.Select(t => new TranslationResponse(t.LanguageCode, new Dictionary<string, string?> { ["Name"] = t.Name, ["Description"] = t.Description })).ToArray();
            }
            case "products":
            {
                var rows = await db.ProductTranslations.AsNoTracking().Where(t => t.ProductId == id)
                    .Select(t => new { t.LanguageCode, t.Title, t.Description, t.BadgeText }).ToArrayAsync(ct);
                return rows.Select(t => new TranslationResponse(t.LanguageCode, new Dictionary<string, string?> { ["Title"] = t.Title, ["Description"] = t.Description, ["BadgeText"] = t.BadgeText })).ToArray();
            }
            case "portfolio-items":
            {
                var rows = await db.PortfolioItemTranslations.AsNoTracking().Where(t => t.PortfolioItemId == id)
                    .Select(t => new { t.LanguageCode, t.Title, t.Meta, t.CategoryTag }).ToArrayAsync(ct);
                return rows.Select(t => new TranslationResponse(t.LanguageCode, new Dictionary<string, string?> { ["Title"] = t.Title, ["Meta"] = t.Meta, ["CategoryTag"] = t.CategoryTag })).ToArray();
            }
            case "gallery-items":
            {
                var rows = await db.GalleryItemTranslations.AsNoTracking().Where(t => t.GalleryItemId == id)
                    .Select(t => new { t.LanguageCode, t.Title, t.AltText }).ToArrayAsync(ct);
                return rows.Select(t => new TranslationResponse(t.LanguageCode, new Dictionary<string, string?> { ["Title"] = t.Title, ["AltText"] = t.AltText })).ToArray();
            }
            case "site-content":
            {
                var rows = await db.SiteContentTranslations.AsNoTracking().Where(t => t.SiteContentId == id)
                    .Select(t => new { t.LanguageCode, t.Value }).ToArrayAsync(ct);
                return rows.Select(t => new TranslationResponse(t.LanguageCode, new Dictionary<string, string?> { ["Value"] = t.Value })).ToArray();
            }
            case "hero-stats":
            {
                var rows = await db.HeroStatTranslations.AsNoTracking().Where(t => t.HeroStatId == id)
                    .Select(t => new { t.LanguageCode, t.Label }).ToArrayAsync(ct);
                return rows.Select(t => new TranslationResponse(t.LanguageCode, new Dictionary<string, string?> { ["Label"] = t.Label })).ToArray();
            }
            case "seo-meta":
            {
                var rows = await db.SeoMetaTranslations.AsNoTracking().Where(t => t.SeoMetaId == id)
                    .Select(t => new { t.LanguageCode, t.Title, t.Description, t.Keywords, t.OgTitle, t.OgDescription }).ToArrayAsync(ct);
                return rows.Select(t => new TranslationResponse(t.LanguageCode, new Dictionary<string, string?>
                {
                    ["Title"] = t.Title, ["Description"] = t.Description, ["Keywords"] = t.Keywords,
                    ["OgTitle"] = t.OgTitle, ["OgDescription"] = t.OgDescription
                })).ToArray();
            }
            case "contact-info":
            {
                var rows = await db.ContactInfoTranslations.AsNoTracking().Where(t => t.ContactInfoId == id)
                    .Select(t => new { t.LanguageCode, t.Label }).ToArrayAsync(ct);
                return rows.Select(t => new TranslationResponse(t.LanguageCode, new Dictionary<string, string?> { ["Label"] = t.Label })).ToArray();
            }
            default:
                return [];
        }
    }

    private static async Task<TranslationResponse> UpsertTranslationAsync(
        AppDbContext db, string entity, int id, string languageCode, Dictionary<string, string?> fields, CancellationToken ct)
    {
        switch (entity)
        {
            case "categories":
            {
                var t = await db.CategoryTranslations.FirstOrDefaultAsync(x => x.CategoryId == id && x.LanguageCode == languageCode, ct);
                if (t is null) { t = new CategoryTranslation { CategoryId = id, LanguageCode = languageCode }; db.CategoryTranslations.Add(t); }
                if (fields.TryGetValue("Name", out var name) && name is not null) t.Name = name;
                if (fields.TryGetValue("Description", out var description)) t.Description = description;
                return new TranslationResponse(languageCode, new Dictionary<string, string?> { ["Name"] = t.Name, ["Description"] = t.Description });
            }
            case "products":
            {
                var t = await db.ProductTranslations.FirstOrDefaultAsync(x => x.ProductId == id && x.LanguageCode == languageCode, ct);
                if (t is null) { t = new ProductTranslation { ProductId = id, LanguageCode = languageCode }; db.ProductTranslations.Add(t); }
                if (fields.TryGetValue("Title", out var title) && title is not null) t.Title = title;
                if (fields.TryGetValue("Description", out var description)) t.Description = description;
                if (fields.TryGetValue("BadgeText", out var badgeText)) t.BadgeText = badgeText;
                return new TranslationResponse(languageCode, new Dictionary<string, string?> { ["Title"] = t.Title, ["Description"] = t.Description, ["BadgeText"] = t.BadgeText });
            }
            case "portfolio-items":
            {
                var t = await db.PortfolioItemTranslations.FirstOrDefaultAsync(x => x.PortfolioItemId == id && x.LanguageCode == languageCode, ct);
                if (t is null) { t = new PortfolioItemTranslation { PortfolioItemId = id, LanguageCode = languageCode }; db.PortfolioItemTranslations.Add(t); }
                if (fields.TryGetValue("Title", out var title) && title is not null) t.Title = title;
                if (fields.TryGetValue("Meta", out var meta)) t.Meta = meta;
                if (fields.TryGetValue("CategoryTag", out var categoryTag)) t.CategoryTag = categoryTag;
                return new TranslationResponse(languageCode, new Dictionary<string, string?> { ["Title"] = t.Title, ["Meta"] = t.Meta, ["CategoryTag"] = t.CategoryTag });
            }
            case "gallery-items":
            {
                var t = await db.GalleryItemTranslations.FirstOrDefaultAsync(x => x.GalleryItemId == id && x.LanguageCode == languageCode, ct);
                if (t is null) { t = new GalleryItemTranslation { GalleryItemId = id, LanguageCode = languageCode }; db.GalleryItemTranslations.Add(t); }
                if (fields.TryGetValue("Title", out var title) && title is not null) t.Title = title;
                if (fields.TryGetValue("AltText", out var altText)) t.AltText = altText;
                return new TranslationResponse(languageCode, new Dictionary<string, string?> { ["Title"] = t.Title, ["AltText"] = t.AltText });
            }
            case "site-content":
            {
                var t = await db.SiteContentTranslations.FirstOrDefaultAsync(x => x.SiteContentId == id && x.LanguageCode == languageCode, ct);
                if (t is null) { t = new SiteContentTranslation { SiteContentId = id, LanguageCode = languageCode }; db.SiteContentTranslations.Add(t); }
                if (fields.TryGetValue("Value", out var value) && value is not null) t.Value = value;
                return new TranslationResponse(languageCode, new Dictionary<string, string?> { ["Value"] = t.Value });
            }
            case "hero-stats":
            {
                var t = await db.HeroStatTranslations.FirstOrDefaultAsync(x => x.HeroStatId == id && x.LanguageCode == languageCode, ct);
                if (t is null) { t = new HeroStatTranslation { HeroStatId = id, LanguageCode = languageCode }; db.HeroStatTranslations.Add(t); }
                if (fields.TryGetValue("Label", out var label) && label is not null) t.Label = label;
                return new TranslationResponse(languageCode, new Dictionary<string, string?> { ["Label"] = t.Label });
            }
            case "seo-meta":
            {
                var t = await db.SeoMetaTranslations.FirstOrDefaultAsync(x => x.SeoMetaId == id && x.LanguageCode == languageCode, ct);
                if (t is null) { t = new SeoMetaTranslation { SeoMetaId = id, LanguageCode = languageCode }; db.SeoMetaTranslations.Add(t); }
                if (fields.TryGetValue("Title", out var title) && title is not null) t.Title = title;
                if (fields.TryGetValue("Description", out var description)) t.Description = description;
                if (fields.TryGetValue("Keywords", out var keywords)) t.Keywords = keywords;
                if (fields.TryGetValue("OgTitle", out var ogTitle)) t.OgTitle = ogTitle;
                if (fields.TryGetValue("OgDescription", out var ogDescription)) t.OgDescription = ogDescription;
                return new TranslationResponse(languageCode, new Dictionary<string, string?>
                {
                    ["Title"] = t.Title, ["Description"] = t.Description, ["Keywords"] = t.Keywords,
                    ["OgTitle"] = t.OgTitle, ["OgDescription"] = t.OgDescription
                });
            }
            case "contact-info":
            {
                var t = await db.ContactInfoTranslations.FirstOrDefaultAsync(x => x.ContactInfoId == id && x.LanguageCode == languageCode, ct);
                if (t is null) { t = new ContactInfoTranslation { ContactInfoId = id, LanguageCode = languageCode }; db.ContactInfoTranslations.Add(t); }
                if (fields.TryGetValue("Label", out var label) && label is not null) t.Label = label;
                return new TranslationResponse(languageCode, new Dictionary<string, string?> { ["Label"] = t.Label });
            }
            default:
                throw new InvalidOperationException($"Unhandled entity '{entity}'");
        }
    }
}
