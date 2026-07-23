namespace VeronzoApi.Endpoints.Admin;

// Every admin route sits behind RequireAuthorization(Roles="Admin"), so 401/403 are
// always possible outcomes — factored out here instead of repeating on all 40 routes.
internal static class AdminSwaggerExtensions
{
    public static RouteHandlerBuilder WithAdminAuthResponses(this RouteHandlerBuilder builder) =>
        builder
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);
}
