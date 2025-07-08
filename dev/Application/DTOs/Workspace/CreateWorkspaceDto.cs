namespace dev.Application.DTOs.Workspace;

public class CreateWorkspaceDto
{
    public required string Name { get; set; }
    public required string Description { get; set; }
    public string UserId { get; set; } = string.Empty;
}