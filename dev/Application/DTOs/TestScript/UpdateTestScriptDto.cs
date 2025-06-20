namespace dev.Application.DTOs.TestScript;

public class UpdateTestScriptDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ScriptContent { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int RequestId { get; set; }
}
