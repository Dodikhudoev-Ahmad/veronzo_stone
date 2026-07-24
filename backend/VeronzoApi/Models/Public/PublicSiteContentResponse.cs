namespace VeronzoApi.Models.Public;

// No Id — Key is already the unique, natural identifier for this key/value entity
// and is all a consumer needs to look up a piece of text.
public record PublicSiteContentResponse(string Key, string Value);
