using dev.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace dev.Application.DTOs.Collaboration;

public class UpdateCollaborationStatusRequest
{
    [Required]
    public int CollaborationId { get; set; }
    
    [Required]
    public CollaborationStatus Status { get; set; }
}
