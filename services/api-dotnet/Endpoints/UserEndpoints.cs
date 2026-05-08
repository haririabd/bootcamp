using KanbanApi.Data;
using KanbanApi.Models;
using Microsoft.EntityFrameworkCore;

namespace KanbanApi.Endpoints;

public static class UserEndpoints
{
    public static void MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users")
            .WithTags("Users")
            .RequireAuthorization()
            .RequireRateLimiting("api_general");

        group.MapGet("/search", async (string q, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
                return Results.Ok(Array.Empty<UserSearchItem>());

            var searchLower = q.Trim().ToLowerInvariant();

            var users = await db.Users
                .AsNoTracking()
                .Where(u => u.IsActive && (u.DisplayName.ToLower().Contains(searchLower) || u.Email.ToLower().Contains(searchLower)))
                .Take(10)
                .Select(u => new UserSearchItem(u.Id, u.DisplayName, u.Email, u.AvatarUrl))
                .ToListAsync();

            return Results.Ok(users);
        });
    }
}
