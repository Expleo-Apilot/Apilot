namespace dev.Application.DTOs.Environment;

public class CreateEnvironmentRequest
{
    public required string Name { get; set; } 
    public int WorkSpaceId { get; set; }
    
}