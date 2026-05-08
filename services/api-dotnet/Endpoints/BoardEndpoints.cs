using KanbanApi.Data;
using KanbanApi.Data.Entities;
using KanbanApi.Infrastructure;
using KanbanApi.Models;
using Microsoft.EntityFrameworkCore;

namespace KanbanApi.Endpoints;

public static class BoardEndpoints
{
    public static void MapBoardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/boards")
            .WithTags("Boards")
            .RequireAuthorization()
            .RequireRateLimiting("api_general");

        group.MapGet("/", async (HttpContext ctx, AppDbContext db, int? page, int? pageSize) =>
        {
            var userId = AuthHelpers.GetCurrentUserId(ctx);
            if (userId is null) return Results.Unauthorized();

            var currentPage = Math.Max(1, page ?? 1);
            var currentPageSize = Math.Clamp(pageSize ?? 20, 1, 100);

            var query = db.Boards.AsQueryable();

            if (!AuthHelpers.IsAdmin(ctx))
            {
                // Return boards where user is Owner OR a Member
                query = query.Where(b => b.OwnerId == userId || b.Members.Any(m => m.UserId == userId));
            }

            var totalCount = await query.CountAsync();

            var boards = await query
                .OrderByDescending(b => b.CreatedAt)
                .Skip((currentPage - 1) * currentPageSize)
                .Take(currentPageSize)
                .ToListAsync();

            var items = boards.Select(b =>
                new BoardResponse(b.Id, b.Title, b.Description, b.OwnerId, b.CreatedAt, b.UpdatedAt)).ToList();

            return Results.Ok(new PaginatedResponse<BoardResponse>(items, totalCount, currentPage, currentPageSize));
        });

        group.MapPost("/", async (HttpContext ctx, CreateBoardRequest req, AppDbContext db) =>
        {
            var userId = AuthHelpers.GetCurrentUserId(ctx);
            if (userId is null) return Results.Unauthorized();

            var boardCount = await db.Boards.CountAsync(b => b.OwnerId == userId);
            if (boardCount >= ResourceLimits.MaxBoardsPerUser)
                return Results.BadRequest(new ErrorResponse(
                    $"Maximum number of boards ({ResourceLimits.MaxBoardsPerUser}) reached."));

            var title = SanitizationHelper.SanitizeAndTrim(req.Title)!;
            var description = SanitizationHelper.SanitizeAndTrim(req.Description);

            var entity = new BoardEntity
            {
                Title = title,
                Description = description,
                OwnerId = userId
            };

            db.Boards.Add(entity);
            await db.SaveChangesAsync();

            return Results.Created($"/api/boards/{entity.Id}",
                new BoardResponse(entity.Id, entity.Title, entity.Description, entity.OwnerId, entity.CreatedAt, entity.UpdatedAt));
        })
        .WithValidation<CreateBoardRequest>();

        group.MapGet("/{boardId}", async (string boardId, HttpContext ctx, AppDbContext db) =>
        {
            var userId = await AuthHelpers.AuthorizeBoardAccess(ctx, db, boardId);
            if (userId is null)
                return Results.Json(new ErrorResponse("Board not found or access denied"), statusCode: 403);

            var board = await db.Boards
                .Include(b => b.Columns).ThenInclude(c => c.Tasks)
                .Include(b => b.Members).ThenInclude(m => m.User) // Include Members for the response
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board is null)
                return Results.NotFound(new ErrorResponse("Board not found"));

            var response = new BoardDetailResponse(
                board.Id, board.Title, board.Description, board.OwnerId, board.CreatedAt, board.UpdatedAt,
                board.Columns.OrderBy(c => c.Position).Select(c => new ColumnResponse(
                    c.Id, c.Title, c.Position, c.BoardId,
                    c.Tasks.OrderBy(t => t.Position).Select(t => new TaskItemResponse(
                        t.Id, t.Title, t.Description, t.Position, t.ColumnId, t.AssigneeId, t.Priority, t.Tags, t.DueDate, t.Comments?.Count ?? 0, t.Attachments?.Count ?? 0, t.CreatedAt, t.UpdatedAt
                    )).ToList()
                )).ToList(),
                board.Members.Select(m => new BoardMemberResponse(
                    m.UserId, m.User.DisplayName, m.User.Email, m.User.AvatarUrl, m.Role
                )).ToList()
            );
            return Results.Ok(response);
        });

        group.MapPatch("/{boardId}", async (string boardId, HttpContext ctx, UpdateBoardRequest req, AppDbContext db, ILogger<Program> logger) =>
        {
            var userId = await AuthHelpers.AuthorizeBoardAccess(ctx, db, boardId);
            if (userId is null)
                return Results.Json(new ErrorResponse("Board not found or access denied"), statusCode: 403);

            return await ConcurrencyHandler.ExecuteWithConcurrencyHandling(db, async () =>
            {
                var board = await db.Boards.FindAsync(boardId);
                if (board is null)
                    return Results.NotFound(new ErrorResponse("Board not found"));

                // We allow members (editors) to update the board title/description
                if (req.Title is not null) board.Title = SanitizationHelper.SanitizeAndTrim(req.Title) ?? board.Title;
                if (req.Description is not null) board.Description = SanitizationHelper.SanitizeAndTrim(req.Description);
                board.UpdatedAt = DateTimeOffset.UtcNow;

                await db.SaveChangesAsync();
                return Results.Ok(new BoardResponse(board.Id, board.Title, board.Description, board.OwnerId, board.CreatedAt, board.UpdatedAt));
            }, logger, "board");
        })
        .WithValidation<UpdateBoardRequest>();

        group.MapDelete("/{boardId}", async (string boardId, HttpContext ctx, AppDbContext db) =>
        {
            var userId = AuthHelpers.GetCurrentUserId(ctx);
            if (userId is null) return Results.Unauthorized();

            var board = await db.Boards.FindAsync(boardId);
            if (board is null)
                return Results.NotFound(new ErrorResponse("Board not found"));

            // Only the owner or an admin can delete the board
            if (board.OwnerId != userId && !AuthHelpers.IsAdmin(ctx))
                return Results.Json(new ErrorResponse("Only the board owner can delete this board."), statusCode: 403);

            db.Boards.Remove(board);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // ─── Board Members (Collaboration) ──────────────────────────────

        group.MapPost("/{boardId}/members", async (string boardId, HttpContext ctx, AddBoardMemberRequest req, AppDbContext db) =>
        {
            var currentUserId = AuthHelpers.GetCurrentUserId(ctx);
            var board = await db.Boards.FindAsync(boardId);

            if (board is null) return Results.NotFound(new ErrorResponse("Board not found"));

            // Only the owner or admin can add members
            if (board.OwnerId != currentUserId && !AuthHelpers.IsAdmin(ctx))
                return Results.Json(new ErrorResponse("Only the board owner can add members."), statusCode: 403);

            if (board.OwnerId == req.UserId)
                return Results.BadRequest(new ErrorResponse("Owner is already a member."));

            if (await db.BoardMembers.AnyAsync(m => m.BoardId == boardId && m.UserId == req.UserId))
                return Results.BadRequest(new ErrorResponse("User is already a member of this board."));

            var user = await db.Users.FindAsync(req.UserId);
            if (user is null) return Results.NotFound(new ErrorResponse("User not found."));

            var member = new BoardMemberEntity { BoardId = boardId, UserId = req.UserId, Role = req.Role ?? "editor" };
            db.BoardMembers.Add(member);
            await db.SaveChangesAsync();

            return Results.Ok(new BoardMemberResponse(user.Id, user.DisplayName, user.Email, user.AvatarUrl, member.Role));
        });

        group.MapDelete("/{boardId}/members/{userId}", async (string boardId, string userId, HttpContext ctx, AppDbContext db) =>
        {
            var currentUserId = AuthHelpers.GetCurrentUserId(ctx);
            var board = await db.Boards.FindAsync(boardId);

            if (board is null) return Results.NotFound(new ErrorResponse("Board not found"));

            // The owner can remove anyone. A member can remove themselves (leave the board).
            if (board.OwnerId != currentUserId && currentUserId != userId && !AuthHelpers.IsAdmin(ctx))
                return Results.Json(new ErrorResponse("You don't have permission to remove members."), statusCode: 403);

            var member = await db.BoardMembers.FirstOrDefaultAsync(m => m.BoardId == boardId && m.UserId == userId);
            if (member is null) return Results.NotFound(new ErrorResponse("Member not found on this board."));

            db.BoardMembers.Remove(member);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
