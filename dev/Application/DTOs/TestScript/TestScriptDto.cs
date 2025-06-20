namespace dev.Application.DTOs.TestScript;

public class TestScriptDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ScriptContent { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int RequestId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
