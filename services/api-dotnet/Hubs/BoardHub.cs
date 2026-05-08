using Microsoft.AspNetCore.SignalR;

namespace KanbanApi.Hubs;

public class BoardHub : Hub
{
    // Clients call this when they open a board
    public async Task JoinBoard(string boardId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, boardId);
    }

    // Clients call this when they leave a board
    public async Task LeaveBoard(string boardId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, boardId);
    }
}
