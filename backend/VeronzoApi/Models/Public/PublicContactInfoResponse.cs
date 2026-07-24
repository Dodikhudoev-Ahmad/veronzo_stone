namespace VeronzoApi.Models.Public;

// No Id — Label is the natural key (Showroom/Phone/Email); the public site just
// needs the ordered label/value pairs to render.
public record PublicContactInfoResponse(string Label, string Value);
