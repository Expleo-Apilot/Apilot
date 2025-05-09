namespace dev.Application.DTOs.Environment;

public class CreateEnvironmentDto
{
    public required string Name { get; set; } 
    public int WorkSpaceId { get; set; }
    
}