namespace dev.Application.DTOs.Environment;

public class ImportEnvironmentsRequest
{
    public int WorkspaceId { get; set; }
    public List<ImportEnvironmentData> Environments { get; set; } = new();
    public string? ExportedAt { get; set; }
    public string? ExportedBy { get; set; }
}

public class ImportEnvironmentData
{
    public string Name { get; set; } = string.Empty;
    public Dictionary<string, string> Variables { get; set; } = new();
    public int? Id { get; set; } // Original ID from export (will be ignored during import)
}
