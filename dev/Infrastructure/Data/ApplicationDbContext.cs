using System.Text.Json;
using dev.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Environment = dev.Domain.Entities.Environment;

namespace dev.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }
    
    public DbSet<Workspace> Workspaces { get; set; }
    public DbSet<Collection> Collections { get; set; }
    public DbSet<Environment> Environments { get; set; }
    public DbSet<Folder> Folders { get; set; }
    public DbSet<RequestEntity> Requests { get; set; }
    public DbSet<ResponseEntity> Responses { get; set; }
    public DbSet<HistoryEntity> Histories { get; set; }
    public DbSet<EmailVerification> EmailVerifications { get; set; }
    public DbSet<Collaboration> Collaborations { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        

        modelBuilder.Entity<ApplicationUser>()
            .HasMany(u => u.Workspaces)
            .WithOne(w => w.User)
            .HasForeignKey(w => w.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        
        
        
        modelBuilder.Entity<Workspace>()
            .HasMany(w => w.Collections)
            .WithOne(c => c.WorkSpace)
            .HasForeignKey(c => c.WorkSpaceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Workspace>()
            .HasMany(w => w.Environments)
            .WithOne(e => e.Workspace)
            .HasForeignKey(e => e.WorkSpaceId)
            .OnDelete(DeleteBehavior.Cascade);
        
        modelBuilder.Entity<Workspace>()
            .HasMany(w => w.Histories)
            .WithOne(e => e.Workspace)
            .HasForeignKey(e => e.WorkSpaceId)
            .OnDelete(DeleteBehavior.Cascade);

        
        modelBuilder.Entity<Collection>()
            .HasMany(c => c.Folders)
            .WithOne(f => f.Collection)
            .HasForeignKey(f => f.CollectionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Collection>()
            .HasMany(c => c.Requests)
            .WithOne(r => r.Collection)
            .HasForeignKey(r => r.CollectionId)
            .OnDelete(DeleteBehavior.Cascade); 
        
        
        modelBuilder.Entity<Folder>()
            .HasMany(f => f.Requests)
            .WithOne(r => r.Folder)
            .HasForeignKey(r => r.FolderId)
            .OnDelete(DeleteBehavior.NoAction);
        
        
        modelBuilder.Entity<RequestEntity>()
            .HasMany(r => r.Responses)
            .WithOne(r => r.Request)
            .HasForeignKey(r => r.RequestId)
            .OnDelete(DeleteBehavior.Cascade);
        
        

        modelBuilder.Entity<HistoryEntity>()
            .OwnsOne(r => r.Requests, req =>
            {

                req.Property(a => a.Url);
                req.Property(a => a.Body);
                req.Property(a => a.HttpMethod);

                req.Property(a => a.Headers)
                    .HasConversion(
                        v => JsonSerializer.Serialize(v, new JsonSerializerOptions()),
                        v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, new JsonSerializerOptions()) ??
                             new Dictionary<string, string>());

                req.Property(a => a.Parameters)
                    .HasConversion(
                        v => JsonSerializer.Serialize(v, new JsonSerializerOptions()),
                        v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, new JsonSerializerOptions()) ??
                             new Dictionary<string, string>());

                req.Property(a => a.Body)
                    .HasConversion(
                        v => JsonSerializer.Serialize(v, new JsonSerializerOptions()),
                        v => JsonSerializer.Deserialize<object>(v, new JsonSerializerOptions()));


                req.OwnsOne(r => r.Authentication, authentication =>
                {
                    authentication.Property(a => a.AuthType);

                    authentication.Property(a => a.AuthData)
                        .HasConversion(
                            v => JsonSerializer.Serialize(v, new JsonSerializerOptions()),
                            v =>
                                JsonSerializer.Deserialize<Dictionary<string, string>>(v,
                                    new JsonSerializerOptions()) ?? new Dictionary<string, string>());
                });
            });

        modelBuilder.Entity<RequestEntity>()
            .OwnsOne(r => r.Authentication, authentication =>
            {

                authentication.Property(a => a.AuthType);


                authentication.Property(a => a.AuthData)
                    .HasConversion(
                        v => JsonSerializer.Serialize(v, new JsonSerializerOptions()),
                        v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, new JsonSerializerOptions()) ??
                             new Dictionary<string, string>());
            })
            .Property(a => a.Body)
            .HasConversion(
                v => JsonSerializer.Serialize(v, new JsonSerializerOptions()),
                v => JsonSerializer.Deserialize<object>(v, new JsonSerializerOptions()));



    modelBuilder.Entity<Environment>()
            .Property(e => e.Variables)
            .HasConversion(
                v => JsonSerializer.Serialize(v, new JsonSerializerOptions()),
                v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, new JsonSerializerOptions()) ?? new Dictionary<string, string>());

        modelBuilder.Entity<RequestEntity>()
            .Property(r => r.Headers)
            .HasConversion(
                v => JsonSerializer.Serialize(v, new JsonSerializerOptions()),
                v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, new JsonSerializerOptions()) ?? new Dictionary<string, string>());
        modelBuilder.Entity<RequestEntity>()
            .Property(r => r.Parameters)
            .HasConversion(
                v => JsonSerializer.Serialize(v, new JsonSerializerOptions()),
                v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, new JsonSerializerOptions()) ?? new Dictionary<string, string>());

        modelBuilder.Entity<ResponseEntity>()
            .Property(r => r.Headers)
            .HasConversion(
                v => JsonSerializer.Serialize(v, new JsonSerializerOptions()),
                v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, new JsonSerializerOptions()) ?? new Dictionary<string, string>());

        
        modelBuilder.Entity<ResponseEntity>()
            .Property(a => a.Body)
            .HasConversion(
                v => JsonSerializer.Serialize(v, new JsonSerializerOptions()),
                v => JsonSerializer.Deserialize<object>(v, new JsonSerializerOptions()));
        
        // Configure Collaboration relationships
        modelBuilder.Entity<Collection>()
            .HasMany(c => c.Collaborations)
            .WithOne(collab => collab.Collection)
            .HasForeignKey(collab => collab.CollectionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ApplicationUser>()
            .HasMany(u => u.ReceivedCollaborations)
            .WithOne(collab => collab.InvitedUser)
            .HasForeignKey(collab => collab.InvitedUserId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<ApplicationUser>()
            .HasMany(u => u.SentCollaborations)
            .WithOne(collab => collab.InvitedByUser)
            .HasForeignKey(collab => collab.InvitedByUserId)
            .OnDelete(DeleteBehavior.NoAction);

        // Apply query filters for soft delete
        modelBuilder.Entity<Workspace>().HasQueryFilter(p => !p.IsDeleted);
        modelBuilder.Entity<Collection>().HasQueryFilter(p => !p.IsDeleted);
        modelBuilder.Entity<Folder>().HasQueryFilter(p => !p.IsDeleted);
        modelBuilder.Entity<RequestEntity>().HasQueryFilter(p => !p.IsDeleted);
        modelBuilder.Entity<ResponseEntity>().HasQueryFilter(p => !p.IsDeleted);
        modelBuilder.Entity<Environment>().HasQueryFilter(p => !p.IsDeleted);
        modelBuilder.Entity<HistoryEntity>().HasQueryFilter(p => !p.IsDeleted);
        modelBuilder.Entity<Collaboration>().HasQueryFilter(p => !p.IsDeleted);
        
    }
}