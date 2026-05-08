namespace KanbanApi.Data.Entities;

public class TaskEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Title { get; set; }
    public string? Description { get; set; }
    public int Position { get; set; }

    // Phase 1: Enhanced Task Details
    public string Priority { get; set; } = "medium";
    public string[] Tags { get; set; } = Array.Empty<string>();
    public DateTimeOffset? DueDate { get; set; }

    public required string ColumnId { get; set; }
    public ColumnEntity Column { get; set; } = null!;

    public string? AssigneeId { get; set; }
    public UserEntity? Assignee { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>PostgreSQL xmin system column — used as concurrency token.</summary>
    public uint xmin { get; set; }

    // Phase 7: Navigation properties for Comments and Attachments
    public ICollection<CommentEntity> Comments { get; set; } = new List<CommentEntity>();
    public ICollection<AttachmentEntity> Attachments { get; set; } = new List<AttachmentEntity>();
}
