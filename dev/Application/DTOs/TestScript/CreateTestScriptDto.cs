namespace dev.Application.DTOs.TestScript;

public class CreateTestScriptDto
{
    public string Name { get; set; } = string.Empty;
    public string ScriptContent { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int RequestId { get; set; }
}
