using KanbanApi.Data;
using KanbanApi.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace KanbanApi.Infrastructure;

/// <summary>
/// Seeds the first admin user from environment variables on startup.
/// Set ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_DISPLAY_NAME to create the initial admin.
/// </summary>
public static class AdminSeeder
{
    public static async Task SeedAdminAsync(IServiceProvider services, IConfiguration config)
    {
        var adminEmail = config["ADMIN_EMAIL"];
        var adminPassword = config["ADMIN_PASSWORD"];
        var adminName = config["ADMIN_DISPLAY_NAME"] ?? "Admin";

        if (string.IsNullOrEmpty(adminEmail) || string.IsNullOrEmpty(adminPassword))
        {
            // No admin seed configured — skip
            return;
        }

        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

        var exists = await db.Users.AnyAsync(u => u.Email == adminEmail);
        if (exists)
        {
            logger.LogInformation("Admin user {Email} already exists. Skipping seed.", adminEmail);
            return;
        }

        var user = new UserEntity
        {
            Email = adminEmail,
            DisplayName = adminName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
            Role = "admin",
            IsActive = true
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        logger.LogInformation("Seeded admin user: {Email}", adminEmail);
    }
}
