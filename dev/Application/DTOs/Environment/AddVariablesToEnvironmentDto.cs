namespace dev.Application.DTOs.Environment;

public class AddVariablesToEnvironmentDto
{
    public required int EnvironmentId { get; set; }
    
    public Dictionary<string, string> Variables { get; set; } = new Dictionary<string, string>();
}