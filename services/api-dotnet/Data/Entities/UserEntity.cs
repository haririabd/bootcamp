namespace KanbanApi.Data.Entities;

public class UserEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Email { get; set; }
    public required string DisplayName { get; set; }
    public required string PasswordHash { get; set; }
    public string? AvatarUrl { get; set; } // <--- NEW
    public string Role { get; set; } = "user";
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<BoardEntity> Boards { get; set; } = new List<BoardEntity>();
    public ICollection<TaskEntity> AssignedTasks { get; set; } = new List<TaskEntity>();
}
