using KanbanApi.Data;
using KanbanApi.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace KanbanApi.Infrastructure;

public static class ConcurrencyHandler
{
    public static async Task<IResult> ExecuteWithConcurrencyHandling(
        AppDbContext db, // <-- ADDED THIS PARAMETER
        Func<Task<IResult>> operation,
        ILogger logger,
        string entityDescription = "item")
    {
        // Use the Execution Strategy configured in Program.cs (which includes retries)
        var strategy = db.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            try
            {
                return await operation();
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException pgEx && pgEx.SqlState == "40001")
            {
                logger.LogWarning(ex,
                    "Transaction serialization failure for {Entity}. Another transaction modified the data.",
                    entityDescription);

                return Results.Conflict(new ErrorResponse(
                    $"This {entityDescription} was modified by another user. Please refresh and try again."));
            }
            catch (DbUpdateConcurrencyException ex)
            {
                logger.LogWarning(ex,
                    "Concurrency conflict detected for {Entity}. Another user modified the data.",
                    entityDescription);

                return Results.Conflict(new ErrorResponse(
                    $"This {entityDescription} was modified by another user. Please refresh and try again."));
            }
        });
    }
}
