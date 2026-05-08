using System.Security.Claims;
using KanbanApi.Data;
using KanbanApi.Data.Entities;
using KanbanApi.Infrastructure;
using KanbanApi.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;

namespace KanbanApi.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        group.MapPost("/register", async (RegisterRequest req, AppDbContext db) =>
        {
            var email = SanitizationHelper.SanitizeAndTrim(req.Email)!.ToLowerInvariant();
            var displayName = SanitizationHelper.SanitizeAndTrim(req.DisplayName)!;

            if (await db.Users.AnyAsync(u => u.Email == email))
                return Results.BadRequest(new ErrorResponse("Email already exists"));

            // 1. Pre-generate IDs to easily satisfy 'required' foreign key constraints in the object initializer
            var userId = Guid.NewGuid().ToString();
            var boardId = Guid.NewGuid().ToString();
            var todoColumnId = Guid.NewGuid().ToString();
            var inProgressColumnId = Guid.NewGuid().ToString();
            var doneColumnId = Guid.NewGuid().ToString();

            // 2. Construct the entire default Object Graph (User -> Board -> Columns -> Tasks)
            var user = new UserEntity
            {
                Id = userId,
                Email = email,
                DisplayName = displayName,
                PasswordHash = await Task.Run(() => BCrypt.Net.BCrypt.HashPassword(req.Password)),
                Role = "user",

                // Seed default workspace
                Boards = new List<BoardEntity>
                {
                    new BoardEntity
                    {
                        Id = boardId,
                        Title = "Welcome to Lazuar",
                        Description = "Get started with your new Kanban board.",
                        OwnerId = userId,
                        Columns = new List<ColumnEntity>
                        {
                            new ColumnEntity
                            {
                                Id = todoColumnId,
                                Title = "To Do",
                                Position = 0,
                                BoardId = boardId,
                                Tasks = new List<TaskEntity>
                                {
                                    new TaskEntity
                                    {
                                        Id = Guid.NewGuid().ToString(),
                                        Title = "Drag me to In Progress!",
                                        Description = "Welcome to Lazuar! You can move cards between columns, edit their details, or invite others to collaborate.",
                                        Position = 0,
                                        Priority = "high",
                                        Tags = ["welcome", "tutorial"],
                                        ColumnId = todoColumnId
                                    }
                                }
                            },
                            new ColumnEntity
                            {
                                Id = inProgressColumnId,
                                Title = "In Progress",
                                Position = 1,
                                BoardId = boardId
                            },
                            new ColumnEntity
                            {
                                Id = doneColumnId,
                                Title = "Done",
                                Position = 2,
                                BoardId = boardId
                            }
                        }
                    }
                }
            };

            // 3. Atomically save the entire graph to the database
            db.Users.Add(user);
            await db.SaveChangesAsync();

            return Results.Created("/api/auth/me",
                new UserResponse(user.Id, user.Email, user.DisplayName, user.Role, user.AvatarUrl, user.CreatedAt));
        })
        .WithValidation<RegisterRequest>()
        .RequireRateLimiting("auth_register");

        group.MapPost("/login", async (LoginRequest req, HttpContext ctx, AppDbContext db) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email.ToLowerInvariant());

            if (user is null || !await Task.Run(() => BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash)))
                return Results.Unauthorized();

            if (!user.IsActive)
                return Results.Unauthorized();

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id),
                new(ClaimTypes.Email, user.Email),
                new(ClaimTypes.Name, user.DisplayName),
                new(ClaimTypes.Role, user.Role)
            };

            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            await ctx.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity));

            return Results.Ok(new UserResponse(user.Id, user.Email, user.DisplayName, user.Role, user.AvatarUrl, user.CreatedAt));
        })
        .WithValidation<LoginRequest>()
        .RequireRateLimiting("auth_strict");

        group.MapPost("/logout", async (HttpContext ctx) =>
        {
            await ctx.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Results.NoContent();
        }).RequireAuthorization();

        group.MapGet("/me", async (HttpContext ctx, AppDbContext db) =>
        {
            var userId = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId is null) return Results.Unauthorized();

            var user = await db.Users.FindAsync(userId);
            if (user is null) return Results.Unauthorized();

            return Results.Ok(new UserResponse(user.Id, user.Email, user.DisplayName, user.Role, user.AvatarUrl, user.CreatedAt));
        }).RequireAuthorization();

        group.MapPatch("/me", async (UpdateProfileRequest req, HttpContext ctx, AppDbContext db) =>
        {
            var userId = AuthHelpers.GetCurrentUserId(ctx);
            if (userId is null) return Results.Unauthorized();

            var user = await db.Users.FindAsync(userId);
            if (user is null || !user.IsActive) return Results.Unauthorized();

            if (!string.IsNullOrWhiteSpace(req.DisplayName))
            {
                user.DisplayName = SanitizationHelper.SanitizeAndTrim(req.DisplayName)!;
            }

            if (req.AvatarUrl is not null) // Allows clearing avatar if empty string is passed
            {
                user.AvatarUrl = SanitizationHelper.SanitizeAndTrim(req.AvatarUrl);
            }

            if (!string.IsNullOrWhiteSpace(req.NewPassword))
            {
                if (string.IsNullOrWhiteSpace(req.CurrentPassword))
                    return Results.BadRequest(new ErrorResponse("Current password is required to set a new password."));

                if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))
                    return Results.BadRequest(new ErrorResponse("Current password is incorrect."));

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
            }

            await db.SaveChangesAsync();

            return Results.Ok(new UserResponse(user.Id, user.Email, user.DisplayName, user.Role, user.AvatarUrl, user.CreatedAt));
        }).RequireAuthorization();
    }
}
