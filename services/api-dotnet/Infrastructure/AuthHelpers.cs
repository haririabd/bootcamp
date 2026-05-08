using System.Security.Claims;
using KanbanApi.Data;
using Microsoft.EntityFrameworkCore;

namespace KanbanApi.Infrastructure;

public static class AuthHelpers
{
    /// <summary>
    /// Extracts the current user's ID from the ClaimsPrincipal.
    /// Returns null if not authenticated.
    /// </summary>
    public static string? GetCurrentUserId(HttpContext ctx)
    {
        return ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    /// <summary>
    /// Checks if the current user is an admin.
    /// </summary>
    public static bool IsAdmin(HttpContext ctx)
    {
        return ctx.User.IsInRole("admin");
    }

    /// <summary>
    /// Verifies that the given board belongs to the current user (as owner or member), or user is admin.
    /// Returns the userId if valid, or null.
    /// </summary>
    public static async Task<string?> AuthorizeBoardAccess(
        HttpContext ctx, AppDbContext db, string boardId)
    {
        var userId = GetCurrentUserId(ctx);
        if (userId is null) return null;

        // Admins can access all boards
        if (IsAdmin(ctx)) return userId;

        var hasAccess = await db.Boards
            .Where(b => b.Id == boardId)
            .AnyAsync(b => b.OwnerId == userId || b.Members.Any(m => m.UserId == userId));

        if (!hasAccess)
        {
            return null; // caller should return 403/404
        }

        return userId;
    }

    /// <summary>
    /// Verifies the board that owns a column belongs to the current user (as owner or member).
    /// Returns the userId if valid, or null.
    /// </summary>
    public static async Task<string?> AuthorizeColumnAccess(
        HttpContext ctx, AppDbContext db, string columnId)
    {
        var userId = GetCurrentUserId(ctx);
        if (userId is null) return null;

        if (IsAdmin(ctx)) return userId;

        var hasAccess = await db.Columns
            .Where(c => c.Id == columnId)
            .AnyAsync(c => c.Board.OwnerId == userId || c.Board.Members.Any(m => m.UserId == userId));

        if (!hasAccess)
        {
            return null;
        }

        return userId;
    }
}
