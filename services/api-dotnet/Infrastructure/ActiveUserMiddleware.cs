using System.Security.Claims;
using KanbanApi.Data;
using Microsoft.EntityFrameworkCore;

namespace KanbanApi.Infrastructure;

/// <summary>
/// Middleware that checks if the authenticated user's account is still active.
/// If the account has been disabled mid-session, returns 403 Forbidden.
/// </summary>
public class ActiveUserMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ActiveUserMiddleware> _logger;

    public ActiveUserMiddleware(RequestDelegate next, ILogger<ActiveUserMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        // Only check authenticated users
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId is not null)
            {
                var user = await db.Users
                    .AsNoTracking()
                    .Where(u => u.Id == userId)
                    .Select(u => new { u.IsActive })
                    .FirstOrDefaultAsync();

                if (user is null || !user.IsActive)
                {
                    _logger.LogWarning(
                        "Blocked request from disabled/deleted user {UserId} to {Path}",
                        userId, context.Request.Path);

                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsJsonAsync(new
                    {
                        message = "Account is disabled or does not exist."
                    });
                    return;
                }
            }
        }

        await _next(context);
    }
}
