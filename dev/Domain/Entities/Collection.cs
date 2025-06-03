using dev.Domain.Common;

namespace dev.Domain.Entities;

public class Collection : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    public int WorkSpaceId { get; set; }
    public Workspace WorkSpace { get; set; } = null!;

    public List<Folder> Folders { get; set; } = new List<Folder>();
    public List<RequestEntity> Requests { get; set; } = new List<RequestEntity>();
    
    // Collaborations for this collection
    public List<Collaboration> Collaborations { get; set; } = new List<Collaboration>();
}