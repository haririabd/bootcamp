namespace KanbanApi.Infrastructure;

/// <summary>
/// Middleware that adds security headers to all responses.
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Prevent MIME type sniffing
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";

        // Prevent clickjacking
        context.Response.Headers["X-Frame-Options"] = "DENY";

        // Referrer policy
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        // Permissions policy — disable unnecessary browser features
        context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";

        // XSS Protection (legacy, but set explicitly to 0 per OWASP recommendation)
        context.Response.Headers["X-XSS-Protection"] = "0";

        await _next(context);
    }
}
