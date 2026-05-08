namespace KanbanApi.Infrastructure;

/// <summary>
/// Defines resource limits to prevent abuse.
/// </summary>
public static class ResourceLimits
{
    /// <summary>Maximum number of columns allowed per board.</summary>
    public const int MaxColumnsPerBoard = 20;

    /// <summary>Maximum number of tasks allowed per column.</summary>
    public const int MaxTasksPerColumn = 100;

    /// <summary>Maximum number of boards allowed per user.</summary>
    public const int MaxBoardsPerUser = 50;
}
