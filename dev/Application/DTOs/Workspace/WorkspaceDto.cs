using dev.Application.DTOs.Collection;
using dev.Application.DTOs.Environment;
using dev.Application.DTOs.History;

namespace dev.Application.DTOs.Workspace;

public class WorkspaceDto
{
    public int Id { get; set; }
    public required string Name { get; set; } 
    public required string Description { get; set; }


    public string UserId { get; set; } = string.Empty;
    public string? UserName { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    
    public DateTime? LastSyncDate { get; set; }
    public Guid SyncId { get; set; }
    
    public List<CollectionDto> Collections { get; set; } = new();
    public List<EnvironmentDto> Environments { get; set; } = new ();
    public List<HistoryDto> Histories { get; set; } =  new ();
   
}