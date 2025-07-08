namespace dev.Application.DTOs.Environment;

public class EnvironmentDto
{
    public int Id { get; set; }
    public required string Name { get; set; } 

    public int WorkSpaceId { get; set; }
    public Dictionary<string, string> Variables { get; set; } = new();

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    
    public DateTime? LastSyncDate { get; set; }
    public Guid SyncId { get; set; }
}