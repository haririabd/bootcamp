namespace KanbanApi.Data.Entities;

public class BoardMemberEntity
{
    public required string BoardId { get; set; }
    public BoardEntity Board { get; set; } = null!;

    public required string UserId { get; set; }
    public UserEntity User { get; set; } = null!;

    public string Role { get; set; } = "editor";
    public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;
}
