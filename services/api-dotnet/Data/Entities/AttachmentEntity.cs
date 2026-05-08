namespace KanbanApi.Data.Entities;

public class AttachmentEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string TaskId { get; set; }
    public TaskEntity Task { get; set; } = null!;

    public required string FileName { get; set; }
    public required string FileUrl { get; set; }

    public required string UploadedByUserId { get; set; }
    public UserEntity UploadedByUser { get; set; } = null!;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
