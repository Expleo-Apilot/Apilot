using dev.Application.DTOs.Request;

namespace dev.Application.DTOs.Folder;

public class FolderDto
{
    public int Id { get; set; }
    public required string Name { get; set; } 

    public int CollectionId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    
    public DateTime? LastSyncDate { get; set; }
    public Guid SyncId { get; set; }
    
    public List<RequestDto> Requests { get; set; } = new ();
}