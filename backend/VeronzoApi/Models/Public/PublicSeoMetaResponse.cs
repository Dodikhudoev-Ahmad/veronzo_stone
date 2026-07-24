namespace VeronzoApi.Models.Public;

// No Id — the resource is addressed by PageKey (GET /api/public/seo-meta/{pageKey}),
// which is already unique-indexed and is the only identifier a consumer needs.
public record PublicSeoMetaResponse(string PageKey, string Title, string? Description, string? OgImageUrl);
