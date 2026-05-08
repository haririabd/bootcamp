using KanbanApi.Data;
using KanbanApi.Infrastructure;
using KanbanApi.Models;
using Microsoft.EntityFrameworkCore;

namespace KanbanApi.Endpoints;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin/users")
            .WithTags("Admin")
            .RequireAuthorization(AuthorizationPolicies.AdminOnly)
            .RequireRateLimiting("api_admin");

        // GET /api/admin/users?page=1&pageSize=20&search=
        group.MapGet("/", async (AppDbContext db, int? page, int? pageSize, string? search) =>
        {
            var currentPage = Math.Max(1, page ?? 1);
            var currentPageSize = Math.Clamp(pageSize ?? 20, 1, 100);

            var query = db.Users.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.Trim().ToLowerInvariant();
                query = query.Where(u =>
                    u.Email.ToLower().Contains(searchLower) ||
                    u.DisplayName.ToLower().Contains(searchLower));
            }

            var totalCount = await query.CountAsync();

            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((currentPage - 1) * currentPageSize)
                .Take(currentPageSize)
                .ToListAsync();

            var items = users.Select(u => new AdminUserListItem(
                u.Id, u.Email, u.DisplayName, u.Role, u.IsActive, u.CreatedAt
            )).ToList();

            return Results.Ok(new PaginatedResponse<AdminUserListItem>(items, totalCount, currentPage, currentPageSize));
        });

        group.MapPatch("/{userId}/role", async (string userId, HttpContext ctx, UpdateUserRoleRequest req, AppDbContext db, ILogger<Program> logger) =>
        {
            var currentUserId = AuthHelpers.GetCurrentUserId(ctx);
            if (currentUserId == userId)
                return Results.BadRequest(new ErrorResponse("Cannot change your own role."));

            var user = await db.Users.FindAsync(userId);
            if (user is null)
                return Results.NotFound(new ErrorResponse("User not found"));

            var previousRole = user.Role;
            user.Role = req.Role.ToLowerInvariant();
            await db.SaveChangesAsync();

            logger.LogWarning(
                "Admin {AdminId} changed role of user {UserId} ({Email}) from '{OldRole}' to '{NewRole}'",
                currentUserId, userId, user.Email, previousRole, req.Role);

            return Results.Ok(new AdminUserListItem(user.Id, user.Email, user.DisplayName, user.Role, user.IsActive, user.CreatedAt));
        })
        .WithValidation<UpdateUserRoleRequest>();

        group.MapPatch("/{userId}/status", async (string userId, HttpContext ctx, UpdateUserStatusRequest req, AppDbContext db, ILogger<Program> logger) =>
        {
            var currentUserId = AuthHelpers.GetCurrentUserId(ctx);
            if (currentUserId == userId)
                return Results.BadRequest(new ErrorResponse("Cannot change your own status."));

            var user = await db.Users.FindAsync(userId);
            if (user is null)
                return Results.NotFound(new ErrorResponse("User not found"));

            var previousStatus = user.IsActive;
            user.IsActive = req.IsActive;
            await db.SaveChangesAsync();

            logger.LogWarning(
                "Admin {AdminId} changed status of user {UserId} ({Email}) from '{OldStatus}' to '{NewStatus}'",
                currentUserId, userId, user.Email,
                previousStatus ? "Active" : "Disabled",
                req.IsActive ? "Active" : "Disabled");

            return Results.Ok(new AdminUserListItem(user.Id, user.Email, user.DisplayName, user.Role, user.IsActive, user.CreatedAt));
        })
        .WithValidation<UpdateUserStatusRequest>();

        // ─── Stats Endpoint ─────────────────────────────────────────

        var statsGroup = app.MapGroup("/api/admin/stats")
            .WithTags("Admin")
            .RequireAuthorization(AuthorizationPolicies.AdminOnly)
            .RequireRateLimiting("api_admin");

        statsGroup.MapGet("/", async (AppDbContext db) =>
        {
            var totalUsers = await db.Users.CountAsync();
            var activeUsers = await db.Users.CountAsync(u => u.IsActive);
            var adminCount = await db.Users.CountAsync(u => u.Role == "admin");
            var totalBoards = await db.Boards.CountAsync();

            var recentUsers = await db.Users
                .OrderByDescending(u => u.CreatedAt)
                .Take(5)
                .Select(u => new AdminUserListItem(
                    u.Id, u.Email, u.DisplayName, u.Role, u.IsActive, u.CreatedAt))
                .ToListAsync();

            return Results.Ok(new AdminStatsResponse(
                totalUsers, activeUsers, adminCount, totalBoards, recentUsers));
        });
    }
}
