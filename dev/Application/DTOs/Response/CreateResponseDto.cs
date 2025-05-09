namespace dev.Application.DTOs.Response;

public class CreateResponseDto
{
    public int StatusCode { get; set; }
    public required string StatusText { get; set; } 
    public Dictionary<string, string> Headers { get; set; } = new();
    public int ResponseTime { get; set; }
    public int ResponseSize { get; set; }
    public object? Body { get; set; }

    public int RequestId { get; set; }
}