using Microsoft.AspNetCore.Identity;

namespace dev.Domain.Entities;

public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsEmailVerified { get; set; } = false;
    
    public List<Workspace> Workspaces { get; set; } = new List<Workspace>();
    
    // Collaborations where this user is invited
    public List<Collaboration> ReceivedCollaborations { get; set; } = new List<Collaboration>();
    
    // Collaborations created by this user
    public List<Collaboration> SentCollaborations { get; set; } = new List<Collaboration>();
}
