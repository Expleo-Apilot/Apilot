using dev.Domain.Common;

namespace dev.Domain.Entities;

public class Environment : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public int WorkSpaceId { get; set; }
    public Workspace Workspace { get; set; } = null!;
    public Dictionary<string, string> Variables { get; set; } = new Dictionary<string, string>();

}