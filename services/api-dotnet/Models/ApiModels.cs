using System.Text.Json.Serialization;

namespace KanbanApi.Models;

// ─── Pagination ─────────────────────────────────────────────────

public record PaginatedResponse<T>(
    [property: JsonPropertyName("items")] IReadOnlyList<T> Items,
    [property: JsonPropertyName("totalCount")] int TotalCount,
    [property: JsonPropertyName("page")] int Page,
    [property: JsonPropertyName("pageSize")] int PageSize
)
{
    [JsonPropertyName("totalPages")]
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

    [JsonPropertyName("hasNextPage")]
    public bool HasNextPage => Page < TotalPages;

    [JsonPropertyName("hasPreviousPage")]
    public bool HasPreviousPage => Page > 1;
}

// ─── Error ──────────────────────────────────────────────────────

public record ErrorResponse(
    [property: JsonPropertyName("message")] string Message,
    [property: JsonPropertyName("errors")] Dictionary<string, string[]>? Errors = null
);

// ─── Auth / User ────────────────────────────────────────────────

public record RegisterRequest(
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("password")] string Password,
    [property: JsonPropertyName("displayName")] string DisplayName
);

public record LoginRequest(
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("password")] string Password
);

public record UpdateProfileRequest(
    [property: JsonPropertyName("displayName")] string? DisplayName = null,
    [property: JsonPropertyName("currentPassword")] string? CurrentPassword = null,
    [property: JsonPropertyName("newPassword")] string? NewPassword = null,
    [property: JsonPropertyName("avatarUrl")] string? AvatarUrl = null
);

public record UserResponse(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("displayName")] string DisplayName,
    [property: JsonPropertyName("role")] string Role,
    [property: JsonPropertyName("avatarUrl")] string? AvatarUrl,
    [property: JsonPropertyName("createdAt")] DateTimeOffset CreatedAt
);

public record UserSearchItem(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("displayName")] string DisplayName,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("avatarUrl")] string? AvatarUrl
);

// ─── Board ──────────────────────────────────────────────────────

public record CreateBoardRequest(
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description = null
);

public record UpdateBoardRequest(
    [property: JsonPropertyName("title")] string? Title = null,
    [property: JsonPropertyName("description")] string? Description = null
);

public record BoardResponse(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("ownerId")] string OwnerId,
    [property: JsonPropertyName("createdAt")] DateTimeOffset CreatedAt,
    [property: JsonPropertyName("updatedAt")] DateTimeOffset UpdatedAt
);

public record BoardDetailResponse(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("ownerId")] string OwnerId,
    [property: JsonPropertyName("createdAt")] DateTimeOffset CreatedAt,
    [property: JsonPropertyName("updatedAt")] DateTimeOffset UpdatedAt,
    [property: JsonPropertyName("columns")] IReadOnlyList<ColumnResponse> Columns,
    [property: JsonPropertyName("members")] IReadOnlyList<BoardMemberResponse> Members
);

// ─── Board Members ──────────────────────────────────────────────

public record AddBoardMemberRequest(
    [property: JsonPropertyName("userId")] string UserId,
    [property: JsonPropertyName("role")] string? Role = "editor"
);

public record BoardMemberResponse(
    [property: JsonPropertyName("userId")] string UserId,
    [property: JsonPropertyName("displayName")] string DisplayName,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("avatarUrl")] string? AvatarUrl,
    [property: JsonPropertyName("role")] string Role
);

// ─── Column ─────────────────────────────────────────────────────

public record CreateColumnRequest(
    [property: JsonPropertyName("title")] string Title
);

public record UpdateColumnRequest(
    [property: JsonPropertyName("title")] string? Title = null,
    [property: JsonPropertyName("position")] int? Position = null
);

public record ColumnResponse(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("position")] int Position,
    [property: JsonPropertyName("boardId")] string BoardId,
    [property: JsonPropertyName("tasks")] IReadOnlyList<TaskItemResponse> Tasks
);

// ─── Task ───────────────────────────────────────────────────────

public record CreateTaskRequest(
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description = null,
    [property: JsonPropertyName("assigneeId")] string? AssigneeId = null,
    [property: JsonPropertyName("priority")] string? Priority = null,
    [property: JsonPropertyName("tags")] string[]? Tags = null,
    [property: JsonPropertyName("dueDate")] DateTimeOffset? DueDate = null
);

public record UpdateTaskRequest(
    [property: JsonPropertyName("title")] string? Title = null,
    [property: JsonPropertyName("description")] string? Description = null,
    [property: JsonPropertyName("assigneeId")] string? AssigneeId = null,
    [property: JsonPropertyName("priority")] string? Priority = null,
    [property: JsonPropertyName("tags")] string[]? Tags = null,
    [property: JsonPropertyName("dueDate")] DateTimeOffset? DueDate = null
);

public record MoveTaskRequest(
    [property: JsonPropertyName("targetColumnId")] string TargetColumnId,
    [property: JsonPropertyName("position")] int Position
);

public record TaskItemResponse(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("position")] int Position,
    [property: JsonPropertyName("columnId")] string ColumnId,
    [property: JsonPropertyName("assigneeId")] string? AssigneeId,
    [property: JsonPropertyName("priority")] string Priority,
    [property: JsonPropertyName("tags")] IReadOnlyList<string> Tags,
    [property: JsonPropertyName("dueDate")] DateTimeOffset? DueDate,
    [property: JsonPropertyName("commentsCount")] int CommentsCount,
    [property: JsonPropertyName("attachmentsCount")] int AttachmentsCount,
    [property: JsonPropertyName("createdAt")] DateTimeOffset CreatedAt,
    [property: JsonPropertyName("updatedAt")] DateTimeOffset UpdatedAt
);

// ─── Comments & Attachments ─────────────────────────────────────

public record CreateCommentRequest(
    [property: JsonPropertyName("text")] string Text
);

public record CommentResponse(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("taskId")] string TaskId,
    [property: JsonPropertyName("userId")] string UserId,
    [property: JsonPropertyName("userDisplayName")] string UserDisplayName,
    [property: JsonPropertyName("userAvatarUrl")] string? UserAvatarUrl,
    [property: JsonPropertyName("text")] string Text,
    [property: JsonPropertyName("createdAt")] DateTimeOffset CreatedAt
);

public record AttachmentResponse(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("taskId")] string TaskId,
    [property: JsonPropertyName("fileName")] string FileName,
    [property: JsonPropertyName("fileUrl")] string FileUrl,
    [property: JsonPropertyName("uploadedByUserId")] string UploadedByUserId,
    [property: JsonPropertyName("createdAt")] DateTimeOffset CreatedAt
);

// ─── Admin ──────────────────────────────────────────────────────

public record AdminUserListItem(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("displayName")] string DisplayName,
    [property: JsonPropertyName("role")] string Role,
    [property: JsonPropertyName("isActive")] bool IsActive,
    [property: JsonPropertyName("createdAt")] DateTimeOffset CreatedAt
);

public record UpdateUserRoleRequest(
    [property: JsonPropertyName("role")] string Role
);

public record UpdateUserStatusRequest(
    [property: JsonPropertyName("isActive")] bool IsActive
);

public record AdminStatsResponse(
    [property: JsonPropertyName("totalUsers")] int TotalUsers,
    [property: JsonPropertyName("activeUsers")] int ActiveUsers,
    [property: JsonPropertyName("adminCount")] int AdminCount,
    [property: JsonPropertyName("totalBoards")] int TotalBoards,
    [property: JsonPropertyName("recentUsers")] IReadOnlyList<AdminUserListItem> RecentUsers
);
