namespace dev.Application.DTOs.Workspace;

public class WorkspaceDto
{
    public int Id { get; set; }
    public required string Name { get; set; } 
    public required string Description { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    
    public DateTime? LastSyncDate { get; set; }
    public Guid SyncId { get; set; }
}