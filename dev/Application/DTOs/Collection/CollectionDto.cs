using dev.Application.DTOs.Folder;
using dev.Application.DTOs.Request;

namespace dev.Application.DTOs.Collection;

public class CollectionDto
{
    public int Id { get; set; }
    public required string Name { get; set; } 
    public required string Description { get; set; } 

    public int WorkSpaceId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    
    public DateTime? LastSyncDate { get; set; }
    public Guid SyncId { get; set; }
    
    public List<FolderDto> Folders { get; set; } = new ();
    public List<RequestDto> Requests { get; set; } = new ();
}