using dev.Domain.Enums;

namespace dev.Application.DTOs.Collaboration;

public class CollaborationDto
{
    public int Id { get; set; }
    public int CollectionId { get; set; }
    public string CollectionName { get; set; } = string.Empty;
    public string InvitedUserId { get; set; } = string.Empty;
    public string InvitedUserEmail { get; set; } = string.Empty;
    public string InvitedByUserId { get; set; } = string.Empty;
    public string InvitedUserName { get; set; } = string.Empty;
    
    public string InvitedByUserEmail { get; set; } = string.Empty;
    public string InvitedByUserName { get; set; } = string.Empty;
    public CollaborationPermission Permission { get; set; }
    public CollaborationStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}
