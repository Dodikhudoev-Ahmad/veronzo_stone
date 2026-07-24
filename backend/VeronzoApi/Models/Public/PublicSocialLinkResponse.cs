namespace VeronzoApi.Models.Public;

// No Id — Platform is the natural key and the public site has no reason to
// reference a social link by database identity.
public record PublicSocialLinkResponse(string Platform, string Url);
