namespace dev.Application.DTOs.Environment;

public class RemoveVariableFromEnvironmentRequest
{
    public int EnvironmentId { get; set; }
    public required string Key { get; set; }
}