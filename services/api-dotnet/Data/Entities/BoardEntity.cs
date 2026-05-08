namespace KanbanApi.Data.Entities;

public class BoardEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Title { get; set; }
    public string? Description { get; set; }

    public required string OwnerId { get; set; }
    public UserEntity Owner { get; set; } = null!;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>PostgreSQL xmin system column — used as concurrency token.</summary>
    public uint xmin { get; set; }

    // Navigation properties
    public ICollection<ColumnEntity> Columns { get; set; } = new List<ColumnEntity>();

    // New Navigation property for Collaboration
    public ICollection<BoardMemberEntity> Members { get; set; } = new List<BoardMemberEntity>();
}
