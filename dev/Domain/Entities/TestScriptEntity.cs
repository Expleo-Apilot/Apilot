using dev.Domain.Common;

namespace dev.Domain.Entities;

public class TestScriptEntity : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string ScriptContent { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    // Foreign key relationship with RequestEntity
    public int RequestId { get; set; }
    public RequestEntity Request { get; set; } = null!;
}
