namespace KanbanApi.Data.Entities;

public class CommentEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string TaskId { get; set; }
    public TaskEntity Task { get; set; } = null!;

    public required string UserId { get; set; }
    public UserEntity User { get; set; } = null!;

    public required string Text { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
