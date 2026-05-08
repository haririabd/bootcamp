using System.Diagnostics;

namespace KanbanApi.Infrastructure;

/// <summary>
/// Middleware that ensures every request has a correlation ID for tracing.
/// - If the client sends X-Correlation-Id, it's used.
/// - Otherwise, a new one is generated.
/// - The correlation ID is added to the response headers and the logging scope.
/// </summary>
public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;
    private const string HeaderName = "X-Correlation-Id";

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ILogger<CorrelationIdMiddleware> logger)
    {
        var correlationId = context.Request.Headers[HeaderName].FirstOrDefault()
                            ?? Activity.Current?.Id
                            ?? Guid.NewGuid().ToString("N")[..12];

        // Add to response headers so the client can reference it
        context.Response.OnStarting(() =>
        {
            context.Response.Headers[HeaderName] = correlationId;
            return Task.CompletedTask;
        });

        // Add to logging scope so all log entries within this request include it
        using (logger.BeginScope(new Dictionary<string, object>
        {
            ["CorrelationId"] = correlationId
        }))
        {
            await _next(context);
        }
    }
}
