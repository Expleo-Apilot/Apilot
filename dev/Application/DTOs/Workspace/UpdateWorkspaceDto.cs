namespace dev.Application.DTOs.Workspace;

public class UpdateWorkspaceDto
{
    public int Id { get; set; }
    public required string Name { get; set; } 
    public required string Description { get; set; }
    public string UserId { get; set; } = string.Empty;
}