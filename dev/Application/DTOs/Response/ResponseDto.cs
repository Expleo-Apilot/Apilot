namespace dev.Application.DTOs.Response;

public class ResponseDto
{
    public int Id { get; set; }
    public int StatusCode { get; set; }
    public required string StatusText { get; set; }
    public Dictionary<string, string> Headers { get; set; } = new();
    public int ResponseTime { get; set; }
    public int ResponseSize { get; set; }
    public object? Body { get; set; }

    public int RequestId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    
    public DateTime? LastSyncDate { get; set; }
    public Guid SyncId { get; set; }
}