namespace dev.Application.DTOs.Environment;

public class AddVariableToEnvironmentRequest
{
    public int EnvironmentId { get; set; }
    public required string Key { get; set; }
    public required string Value { get; set; }
}