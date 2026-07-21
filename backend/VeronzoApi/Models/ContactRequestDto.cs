namespace VeronzoApi.Models;

public record ContactRequestDto(string Name, string Contact, string? Email, string? Type, string? Message);
