using KanbanApi.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace KanbanApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<BoardEntity> Boards => Set<BoardEntity>();
    public DbSet<ColumnEntity> Columns => Set<ColumnEntity>();
    public DbSet<TaskEntity> Tasks => Set<TaskEntity>();

    // Phase 5: Board Collaboration
    public DbSet<BoardMemberEntity> BoardMembers => Set<BoardMemberEntity>();

    // Phase 7: Comments and Attachments
    public DbSet<CommentEntity> Comments => Set<CommentEntity>();
    public DbSet<AttachmentEntity> Attachments => Set<AttachmentEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ─── Core Relationships ────────────────────────────────────────

        modelBuilder.Entity<BoardEntity>()
            .HasMany(b => b.Columns)
            .WithOne(c => c.Board)
            .HasForeignKey(c => c.BoardId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ColumnEntity>()
            .HasMany(c => c.Tasks)
            .WithOne(t => t.Column)
            .HasForeignKey(t => t.ColumnId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserEntity>()
            .HasMany(u => u.Boards)
            .WithOne(b => b.Owner)
            .HasForeignKey(b => b.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<UserEntity>()
            .HasMany(u => u.AssignedTasks)
            .WithOne(t => t.Assignee)
            .HasForeignKey(t => t.AssigneeId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<UserEntity>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // ─── Board Members (Phase 5) ───────────────────────────────────

        modelBuilder.Entity<BoardMemberEntity>()
            .HasKey(bm => new { bm.BoardId, bm.UserId });

        modelBuilder.Entity<BoardMemberEntity>()
            .HasOne(bm => bm.Board)
            .WithMany(b => b.Members)
            .HasForeignKey(bm => bm.BoardId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<BoardMemberEntity>()
            .HasOne(bm => bm.User)
            .WithMany()
            .HasForeignKey(bm => bm.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ─── Comments & Attachments (Phase 7) ──────────────────────────

        modelBuilder.Entity<CommentEntity>()
            .HasOne(c => c.Task)
            .WithMany(t => t.Comments)
            .HasForeignKey(c => c.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CommentEntity>()
            .HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<AttachmentEntity>()
            .HasOne(a => a.Task)
            .WithMany(t => t.Attachments)
            .HasForeignKey(a => a.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AttachmentEntity>()
            .HasOne(a => a.UploadedByUser)
            .WithMany()
            .HasForeignKey(a => a.UploadedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // ─── Concurrency Tokens (PostgreSQL xmin) ──────────────────────

        modelBuilder.Entity<BoardEntity>()
            .Property(e => e.xmin)
            .IsRowVersion();

        modelBuilder.Entity<ColumnEntity>()
            .Property(e => e.xmin)
            .IsRowVersion();

        modelBuilder.Entity<TaskEntity>()
            .Property(e => e.xmin)
            .IsRowVersion();

        // ─── Performance Indexes ───────────────────────────────────────

        modelBuilder.Entity<TaskEntity>()
            .HasIndex(t => new { t.ColumnId, t.Position })
            .HasDatabaseName("IX_Tasks_ColumnId_Position");

        modelBuilder.Entity<ColumnEntity>()
            .HasIndex(c => new { c.BoardId, c.Position })
            .HasDatabaseName("IX_Columns_BoardId_Position");

        modelBuilder.Entity<BoardEntity>()
            .HasIndex(b => b.OwnerId)
            .HasDatabaseName("IX_Boards_OwnerId");

        modelBuilder.Entity<CommentEntity>()
            .HasIndex(c => c.TaskId)
            .HasDatabaseName("IX_Comments_TaskId");

        modelBuilder.Entity<AttachmentEntity>()
            .HasIndex(a => a.TaskId)
            .HasDatabaseName("IX_Attachments_TaskId");
    }
}
