namespace VeronzoApi.Models.Admin;

// Uniform error shape for all admin CRUD endpoints (404/409/business-rule 400).
// Serializes as { "error": "..." } — the same shape the endpoints already used as
// anonymous objects, now typed for Swagger. FluentValidation's 400s still use
// ASP.NET Core's standard ValidationProblem (field-level errors don't fit this
// single-message shape); the auth endpoints are untouched, per this stage's scope.
public record ApiErrorResponse(string Error);
