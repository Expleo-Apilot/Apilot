using dev.Domain.Common;
using dev.Domain.Enums;

namespace dev.Domain.Entities;

public class Collaboration : BaseEntity
{
    public int CollectionId { get; set; }
    public Collection Collection { get; set; } = null!;
    
    public string InvitedUserId { get; set; } = string.Empty;
    public ApplicationUser InvitedUser { get; set; } = null!;
    
    public string InvitedByUserId { get; set; } = string.Empty;
    public ApplicationUser InvitedByUser { get; set; } = null!;
    
    public CollaborationPermission Permission { get; set; }
    public CollaborationStatus Status { get; set; }
}
