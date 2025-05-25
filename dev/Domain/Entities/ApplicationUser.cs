using Microsoft.AspNetCore.Identity;

namespace dev.Domain.Entities;

public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    

    public List<Workspace> Workspaces { get; set; } = new List<Workspace>();
}
