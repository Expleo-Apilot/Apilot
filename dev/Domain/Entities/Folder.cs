using dev.Domain.Common;

namespace dev.Domain.Entities;

public class Folder : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    
    public int CollectionId { get; set; }
    public Collection Collection { get; set; } = null!;
    
    public List<RequestEntity> Requests { get; set; } = new List<RequestEntity>();

}