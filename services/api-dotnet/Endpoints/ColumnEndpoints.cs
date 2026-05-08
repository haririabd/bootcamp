using KanbanApi.Data;
using KanbanApi.Data.Entities;
using KanbanApi.Infrastructure;
using KanbanApi.Models;
using Microsoft.EntityFrameworkCore;

namespace KanbanApi.Endpoints;

public static class ColumnEndpoints
{
    public static void MapColumnEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/boards/{boardId}/columns")
            .WithTags("Columns")
            .RequireAuthorization()
            .RequireRateLimiting("api_general");

        group.MapPost("/", async (string boardId, HttpContext ctx, CreateColumnRequest req, AppDbContext db, ILogger<Program> logger) =>
        {
            var userId = await AuthHelpers.AuthorizeBoardAccess(ctx, db, boardId);
            if (userId is null)
                return Results.Json(new ErrorResponse("Board not found or access denied"), statusCode: 403);

            if (!await db.Boards.AnyAsync(b => b.Id == boardId))
                return Results.NotFound(new ErrorResponse("Board not found"));

            var columnCount = await db.Columns.CountAsync(c => c.BoardId == boardId);
            if (columnCount >= ResourceLimits.MaxColumnsPerBoard)
                return Results.BadRequest(new ErrorResponse(
                    $"Maximum number of columns ({ResourceLimits.MaxColumnsPerBoard}) per board reached."));

            return await ConcurrencyHandler.ExecuteWithConcurrencyHandling(db, async () =>
            {
                var title = SanitizationHelper.SanitizeAndTrim(req.Title)!;

                await using var transaction = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

                var maxPosition = await db.Columns
                    .Where(c => c.BoardId == boardId)
                    .MaxAsync(c => (int?)c.Position) ?? -1;

                var entity = new ColumnEntity { BoardId = boardId, Title = title, Position = maxPosition + 1 };
                db.Columns.Add(entity);
                await db.SaveChangesAsync();
                await transaction.CommitAsync();

                return Results.Created($"/api/boards/{boardId}/columns/{entity.Id}",
                    new ColumnResponse(entity.Id, entity.Title, entity.Position, entity.BoardId, new List<TaskItemResponse>()));
            }, logger, "column");
        })
        .WithValidation<CreateColumnRequest>();

        group.MapPatch("/{columnId}", async (string boardId, string columnId, HttpContext ctx, UpdateColumnRequest req, AppDbContext db, ILogger<Program> logger) =>
        {
            var userId = await AuthHelpers.AuthorizeBoardAccess(ctx, db, boardId);
            if (userId is null)
                return Results.Json(new ErrorResponse("Board not found or access denied"), statusCode: 403);

            return await ConcurrencyHandler.ExecuteWithConcurrencyHandling(db, async () =>
            {
                var column = await db.Columns.Include(c => c.Tasks)
                    .FirstOrDefaultAsync(c => c.Id == columnId && c.BoardId == boardId);
                if (column is null)
                    return Results.NotFound(new ErrorResponse("Column not found"));

                if (req.Title is not null)
                    column.Title = SanitizationHelper.SanitizeAndTrim(req.Title) ?? column.Title;

                if (req.Position.HasValue)
                    column.Position = req.Position.Value;

                await db.SaveChangesAsync();

                var tasks = column.Tasks.OrderBy(t => t.Position).Select(t =>
                    new TaskItemResponse(
                        t.Id, t.Title, t.Description, t.Position, t.ColumnId, t.AssigneeId,
                        t.Priority, t.Tags, t.DueDate,
                        t.Comments?.Count ?? 0,
                        t.Attachments?.Count ?? 0,
                        t.CreatedAt, t.UpdatedAt)).ToList();
                return Results.Ok(new ColumnResponse(column.Id, column.Title, column.Position, column.BoardId, tasks));
            }, logger, "column");
        })
        .WithValidation<UpdateColumnRequest>();

        group.MapDelete("/{columnId}", async (string boardId, string columnId, HttpContext ctx, AppDbContext db, ILogger<Program> logger) =>
        {
            var userId = await AuthHelpers.AuthorizeBoardAccess(ctx, db, boardId);
            if (userId is null)
                return Results.Json(new ErrorResponse("Board not found or access denied"), statusCode: 403);

            return await ConcurrencyHandler.ExecuteWithConcurrencyHandling(db, async () =>
            {
                await using var transaction = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

                var column = await db.Columns.FirstOrDefaultAsync(c => c.Id == columnId && c.BoardId == boardId);
                if (column is null)
                    return Results.NotFound(new ErrorResponse("Column not found"));

                var subsequentColumns = await db.Columns
                    .Where(c => c.BoardId == boardId && c.Position > column.Position)
                    .ToListAsync();
                foreach (var col in subsequentColumns) col.Position--;

                db.Columns.Remove(column);
                await db.SaveChangesAsync();
                await transaction.CommitAsync();

                return Results.NoContent();
            }, logger, "column");
        });
    }
}
