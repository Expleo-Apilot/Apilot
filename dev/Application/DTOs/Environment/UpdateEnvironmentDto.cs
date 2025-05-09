namespace dev.Application.DTOs.Environment;

public class UpdateEnvironmentDto
{
    public int Id { get; set; }
    public required string Name { get; set; } 
    public int WorkSpaceId { get; set; }
    public Dictionary<string, string> Variables { get; set; } = new();
}