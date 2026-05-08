using KanbanApi.Data;
using KanbanApi.Data.Entities;
using KanbanApi.Hubs;
using KanbanApi.Infrastructure;
using KanbanApi.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace KanbanApi.Endpoints;

public static class TaskEndpoints
{
    public static void MapTaskEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/columns/{columnId}/tasks")
            .WithTags("Tasks")
            .RequireAuthorization()
            .RequireRateLimiting("api_general");

        // ─── Core Task Operations ───────────────────────────────────────

        group.MapPost("/", async (string columnId, HttpContext ctx, CreateTaskRequest req, AppDbContext db, ILogger<Program> logger, IHubContext<BoardHub> hubContext) =>
        {
            var userId = await AuthHelpers.AuthorizeColumnAccess(ctx, db, columnId);
            if (userId is null)
                return Results.Json(new ErrorResponse("Column not found or access denied"), statusCode: 403);

            if (!await db.Columns.AnyAsync(c => c.Id == columnId))
                return Results.NotFound(new ErrorResponse("Column not found"));

            var taskCount = await db.Tasks.CountAsync(t => t.ColumnId == columnId);
            if (taskCount >= ResourceLimits.MaxTasksPerColumn)
                return Results.BadRequest(new ErrorResponse($"Maximum number of tasks ({ResourceLimits.MaxTasksPerColumn}) per column reached."));

            var assigneeId = SanitizationHelper.SanitizeAndTrim(req.AssigneeId);
            if (assigneeId is not null && !await db.Users.AnyAsync(u => u.Id == assigneeId))
                return Results.BadRequest(new ErrorResponse("Assignee user not found."));

            return await ConcurrencyHandler.ExecuteWithConcurrencyHandling(db, async () =>
            {
                var title = SanitizationHelper.SanitizeAndTrim(req.Title)!;
                var description = SanitizationHelper.SanitizeAndTrim(req.Description);

                await using var transaction = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

                var maxPosition = await db.Tasks
                    .Where(t => t.ColumnId == columnId)
                    .MaxAsync(t => (int?)t.Position) ?? -1;

                var entity = new TaskEntity
                {
                    ColumnId = columnId,
                    Title = title,
                    Description = description,
                    AssigneeId = assigneeId,
                    Position = maxPosition + 1,
                    Priority = req.Priority ?? "medium",
                    Tags = req.Tags ?? Array.Empty<string>(),
                    DueDate = req.DueDate
                };

                db.Tasks.Add(entity);
                await db.SaveChangesAsync();
                await transaction.CommitAsync();

                // SignalR Broadcast
                var boardId = await db.Columns.Where(c => c.Id == columnId).Select(c => c.BoardId).FirstOrDefaultAsync();
                if (boardId != null) await hubContext.Clients.Group(boardId).SendAsync("BoardUpdated");

                return Results.Created($"/api/columns/{columnId}/tasks/{entity.Id}",
                    new TaskItemResponse(entity.Id, entity.Title, entity.Description, entity.Position, entity.ColumnId, entity.AssigneeId, entity.Priority, entity.Tags, entity.DueDate, 0, 0, entity.CreatedAt, entity.UpdatedAt));
            }, logger, "task");
        })
        .WithValidation<CreateTaskRequest>();

        group.MapPatch("/{taskId}", async (string columnId, string taskId, HttpContext ctx, UpdateTaskRequest req, AppDbContext db, ILogger<Program> logger, IHubContext<BoardHub> hubContext) =>
        {
            var userId = await AuthHelpers.AuthorizeColumnAccess(ctx, db, columnId);
            if (userId is null)
                return Results.Json(new ErrorResponse("Access denied"), statusCode: 403);

            var assigneeId = SanitizationHelper.SanitizeAndTrim(req.AssigneeId);
            if (assigneeId is not null && !await db.Users.AnyAsync(u => u.Id == assigneeId))
                return Results.BadRequest(new ErrorResponse("Assignee user not found."));

            return await ConcurrencyHandler.ExecuteWithConcurrencyHandling(db, async () =>
            {
                var task = await db.Tasks
                    .Include(t => t.Comments)
                    .Include(t => t.Attachments)
                    .FirstOrDefaultAsync(t => t.Id == taskId && t.ColumnId == columnId);

                if (task is null) return Results.NotFound(new ErrorResponse("Task not found"));

                if (req.Title is not null) task.Title = SanitizationHelper.SanitizeAndTrim(req.Title) ?? task.Title;
                if (req.Description is not null) task.Description = SanitizationHelper.SanitizeAndTrim(req.Description);
                if (req.AssigneeId is not null) task.AssigneeId = string.IsNullOrWhiteSpace(assigneeId) ? null : assigneeId;

                if (req.Priority is not null) task.Priority = req.Priority;
                if (req.DueDate is not null) task.DueDate = req.DueDate;
                if (req.Tags is not null)
                {
                    task.Tags = req.Tags
                        .Select(t => SanitizationHelper.SanitizeAndTrim(t))
                        .OfType<string>()
                        .ToArray();
                }

                task.UpdatedAt = DateTimeOffset.UtcNow;
                await db.SaveChangesAsync();

                // SignalR Broadcast
                var boardId = await db.Columns.Where(c => c.Id == columnId).Select(c => c.BoardId).FirstOrDefaultAsync();
                if (boardId != null) await hubContext.Clients.Group(boardId).SendAsync("BoardUpdated");

                return Results.Ok(new TaskItemResponse(task.Id, task.Title, task.Description, task.Position, task.ColumnId, task.AssigneeId, task.Priority, task.Tags, task.DueDate, task.Comments.Count, task.Attachments.Count, task.CreatedAt, task.UpdatedAt));
            }, logger, "task");
        })
        .WithValidation<UpdateTaskRequest>();

        group.MapDelete("/{taskId}", async (string columnId, string taskId, HttpContext ctx, AppDbContext db, ILogger<Program> logger, IHubContext<BoardHub> hubContext) =>
        {
            var userId = await AuthHelpers.AuthorizeColumnAccess(ctx, db, columnId);
            if (userId is null)
                return Results.Json(new ErrorResponse("Access denied"), statusCode: 403);

            return await ConcurrencyHandler.ExecuteWithConcurrencyHandling(db, async () =>
            {
                await using var transaction = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

                var task = await db.Tasks.FirstOrDefaultAsync(t => t.Id == taskId && t.ColumnId == columnId);
                if (task is null) return Results.NotFound(new ErrorResponse("Task not found"));

                var subsequentTasks = await db.Tasks
                    .Where(t => t.ColumnId == columnId && t.Position > task.Position)
                    .ToListAsync();
                foreach (var t in subsequentTasks) t.Position--;

                db.Tasks.Remove(task);
                await db.SaveChangesAsync();
                await transaction.CommitAsync();

                // SignalR Broadcast
                var boardId = await db.Columns.Where(c => c.Id == columnId).Select(c => c.BoardId).FirstOrDefaultAsync();
                if (boardId != null) await hubContext.Clients.Group(boardId).SendAsync("BoardUpdated");

                return Results.NoContent();
            }, logger, "task");
        });

        group.MapPatch("/{taskId}/move", async (string columnId, string taskId, HttpContext ctx, MoveTaskRequest req, AppDbContext db, ILogger<Program> logger, IHubContext<BoardHub> hubContext) =>
        {
            var userId = await AuthHelpers.AuthorizeColumnAccess(ctx, db, columnId);
            if (userId is null)
                return Results.Json(new ErrorResponse("Access denied"), statusCode: 403);

            if (columnId != req.TargetColumnId)
            {
                var targetAccess = await AuthHelpers.AuthorizeColumnAccess(ctx, db, req.TargetColumnId);
                if (targetAccess is null)
                    return Results.Json(new ErrorResponse("Target column not found or access denied"), statusCode: 403);

                if (!await db.Columns.AnyAsync(c => c.Id == req.TargetColumnId))
                    return Results.NotFound(new ErrorResponse("Target column not found"));

                var targetTaskCount = await db.Tasks.CountAsync(t => t.ColumnId == req.TargetColumnId);
                if (targetTaskCount >= ResourceLimits.MaxTasksPerColumn)
                    return Results.BadRequest(new ErrorResponse($"Target column has reached maximum tasks ({ResourceLimits.MaxTasksPerColumn})."));
            }

            return await ConcurrencyHandler.ExecuteWithConcurrencyHandling(db, async () =>
            {
                await using var transaction = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

                var task = await db.Tasks
                    .Include(t => t.Comments)
                    .Include(t => t.Attachments)
                    .FirstOrDefaultAsync(t => t.Id == taskId && t.ColumnId == columnId);

                if (task is null) return Results.NotFound(new ErrorResponse("Task not found"));

                if (task.ColumnId == req.TargetColumnId)
                {
                    if (task.Position < req.Position)
                    {
                        var shiftUp = await db.Tasks
                            .Where(t => t.ColumnId == task.ColumnId && t.Position > task.Position && t.Position <= req.Position)
                            .ToListAsync();
                        foreach (var t in shiftUp) t.Position--;
                    }
                    else if (task.Position > req.Position)
                    {
                        var shiftDown = await db.Tasks
                            .Where(t => t.ColumnId == task.ColumnId && t.Position >= req.Position && t.Position < task.Position)
                            .ToListAsync();
                        foreach (var t in shiftDown) t.Position++;
                    }
                }
                else
                {
                    var oldColTasks = await db.Tasks
                        .Where(t => t.ColumnId == task.ColumnId && t.Position > task.Position)
                        .ToListAsync();
                    foreach (var t in oldColTasks) t.Position--;

                    var newColTasks = await db.Tasks
                        .Where(t => t.ColumnId == req.TargetColumnId && t.Position >= req.Position)
                        .ToListAsync();
                    foreach (var t in newColTasks) t.Position++;

                    task.ColumnId = req.TargetColumnId;
                }

                task.Position = req.Position;
                task.UpdatedAt = DateTimeOffset.UtcNow;

                await db.SaveChangesAsync();
                await transaction.CommitAsync();

                // SignalR Broadcast
                var boardId = await db.Columns.Where(c => c.Id == req.TargetColumnId).Select(c => c.BoardId).FirstOrDefaultAsync();
                if (boardId != null) await hubContext.Clients.Group(boardId).SendAsync("BoardUpdated");

                return Results.Ok(new TaskItemResponse(task.Id, task.Title, task.Description, task.Position, task.ColumnId, task.AssigneeId, task.Priority, task.Tags, task.DueDate, task.Comments.Count, task.Attachments.Count, task.CreatedAt, task.UpdatedAt));
            }, logger, "task");
        })
        .WithValidation<MoveTaskRequest>();

        // ─── Comments & Attachments (Phase 7) ───────────────────────────

        group.MapGet("/{taskId}/comments", async (string columnId, string taskId, HttpContext ctx, AppDbContext db) =>
        {
            var userId = await AuthHelpers.AuthorizeColumnAccess(ctx, db, columnId);
            if (userId is null) return Results.Json(new ErrorResponse("Access denied"), statusCode: 403);

            var comments = await db.Comments
                .Include(c => c.User)
                .Where(c => c.TaskId == taskId)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new CommentResponse(c.Id, c.TaskId, c.UserId, c.User.DisplayName, c.User.AvatarUrl, c.Text, c.CreatedAt))
                .ToListAsync();

            return Results.Ok(comments);
        });

        group.MapPost("/{taskId}/comments", async (string columnId, string taskId, CreateCommentRequest req, HttpContext ctx, AppDbContext db, IHubContext<BoardHub> hubContext) =>
        {
            var userId = await AuthHelpers.AuthorizeColumnAccess(ctx, db, columnId);
            if (userId is null) return Results.Json(new ErrorResponse("Access denied"), statusCode: 403);

            var user = await db.Users.FindAsync(userId);
            var task = await db.Tasks.Include(t => t.Column).FirstOrDefaultAsync(t => t.Id == taskId);

            if (task is null || user is null) return Results.NotFound();

            var text = SanitizationHelper.SanitizeAndTrim(req.Text);
            if (string.IsNullOrWhiteSpace(text)) return Results.BadRequest(new ErrorResponse("Comment text cannot be empty."));

            var comment = new CommentEntity { TaskId = taskId, UserId = userId, Text = text };
            db.Comments.Add(comment);
            await db.SaveChangesAsync();

            await hubContext.Clients.Group(task.Column.BoardId).SendAsync("BoardUpdated");

            return Results.Created($"/api/columns/{columnId}/tasks/{taskId}/comments",
                new CommentResponse(comment.Id, taskId, userId, user.DisplayName, user.AvatarUrl, comment.Text, comment.CreatedAt));
        });

        group.MapPost("/{taskId}/attachments", async (string columnId, string taskId, IFormFile file, HttpContext ctx, AppDbContext db, IWebHostEnvironment env, IHubContext<BoardHub> hubContext) =>
        {
            var userId = await AuthHelpers.AuthorizeColumnAccess(ctx, db, columnId);
            if (userId is null) return Results.Json(new ErrorResponse("Access denied"), statusCode: 403);

            var task = await db.Tasks.Include(t => t.Column).FirstOrDefaultAsync(t => t.Id == taskId);
            if (task is null) return Results.NotFound(new ErrorResponse("Task not found"));

            if (file.Length == 0 || file.Length > 10 * 1024 * 1024) // 10MB limit
                return Results.BadRequest(new ErrorResponse("File must be between 1 byte and 10MB."));

            var uploadsPath = Path.Combine(env.WebRootPath ?? env.ContentRootPath, "wwwroot", "uploads");
            Directory.CreateDirectory(uploadsPath);

            var safeFileName = Path.GetFileName(file.FileName); // removes path info
            var storedFileName = $"{Guid.NewGuid():N}_{safeFileName}";
            var filePath = Path.Combine(uploadsPath, storedFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var fileUrl = $"/uploads/{storedFileName}";

            var attachment = new AttachmentEntity { TaskId = taskId, FileName = safeFileName, FileUrl = fileUrl, UploadedByUserId = userId };
            db.Attachments.Add(attachment);
            await db.SaveChangesAsync();

            await hubContext.Clients.Group(task.Column.BoardId).SendAsync("BoardUpdated");

            return Results.Created(fileUrl, new AttachmentResponse(attachment.Id, taskId, attachment.FileName, attachment.FileUrl, userId, attachment.CreatedAt));
        }).DisableAntiforgery(); // Required for Minimal APIs multipart/form-data support

        group.MapDelete("/{taskId}/attachments/{attachmentId}", async (string columnId, string taskId, string attachmentId, HttpContext ctx, AppDbContext db, IWebHostEnvironment env, IHubContext<BoardHub> hubContext, ILogger<Program> logger) =>
        {
            var userId = await AuthHelpers.AuthorizeColumnAccess(ctx, db, columnId);
            if (userId is null) return Results.Json(new ErrorResponse("Access denied"), statusCode: 403);

            var attachment = await db.Attachments.Include(a => a.Task).ThenInclude(t => t.Column)
                                    .FirstOrDefaultAsync(a => a.Id == attachmentId && a.TaskId == taskId);

            if (attachment is null) return Results.NotFound(new ErrorResponse("Attachment not found"));

            // Optionally delete the physical file here
            try
            {
                var storedFileName = Path.GetFileName(attachment.FileUrl);
                var filePath = Path.Combine(env.WebRootPath ?? env.ContentRootPath, "wwwroot", "uploads", storedFileName);
                if (File.Exists(filePath)) File.Delete(filePath);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to delete physical file for attachment {AttachmentId}", attachmentId);
            }

            db.Attachments.Remove(attachment);
            await db.SaveChangesAsync();

            await hubContext.Clients.Group(attachment.Task.Column.BoardId).SendAsync("BoardUpdated");

            return Results.NoContent();
        });
    }
}
