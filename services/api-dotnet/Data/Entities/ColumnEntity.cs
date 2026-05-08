namespace KanbanApi.Data.Entities;

public class ColumnEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Title { get; set; }
    public int Position { get; set; }

    public required string BoardId { get; set; }
    public BoardEntity Board { get; set; } = null!;

    /// <summary>PostgreSQL xmin system column — used as concurrency token.</summary>
    public uint xmin { get; set; }

    // Navigation properties
    public ICollection<TaskEntity> Tasks { get; set; } = new List<TaskEntity>();
}
