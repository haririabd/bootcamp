namespace KanbanApi.Infrastructure;

/// <summary>
/// Middleware that requires a custom header on state-changing requests (POST, PUT, PATCH, DELETE).
///
/// This prevents CSRF attacks because:
/// - Browsers cannot send custom headers cross-origin without a CORS preflight
/// - Our CORS policy only allows our origins
/// - Therefore any request with this header must originate from our allowed frontend
///
/// The header value doesn't matter — its mere presence proves the request
/// came from JavaScript running on an allowed origin.
/// </summary>
public class CsrfProtectionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<CsrfProtectionMiddleware> _logger;

    private static readonly HashSet<string> ProtectedMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "POST", "PUT", "PATCH", "DELETE"
    };

    // Paths that don't require the CSRF header (e.g., login needs to work from forms)
    private static readonly string[] ExemptPaths =
    [
        "/health",
        "/health/ready"
    ];

    private const string RequiredHeader = "X-Requested-With";

    public CsrfProtectionMiddleware(RequestDelegate next, ILogger<CsrfProtectionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var method = context.Request.Method;
        var path = context.Request.Path.Value ?? "";

        // Only check state-changing methods
        if (!ProtectedMethods.Contains(method))
        {
            await _next(context);
            return;
        }

        // Skip exempt paths
        if (ExemptPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
        {
            await _next(context);
            return;
        }

        // Check for the custom header
        if (!context.Request.Headers.ContainsKey(RequiredHeader))
        {
            _logger.LogWarning(
                "CSRF protection: Blocked {Method} {Path} — missing {Header} header from {IP}",
                method, path, RequiredHeader, context.Connection.RemoteIpAddress);

            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new
            {
                message = "Forbidden: missing required security header."
            });
            return;
        }

        await _next(context);
    }
}
