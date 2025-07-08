using dev.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace dev.Application.DTOs.Collaboration;

public class CreateCollaborationRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public int CollectionId { get; set; }
    
    [Required]
    public CollaborationPermission Permission { get; set; }
}
