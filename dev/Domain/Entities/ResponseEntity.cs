using dev.Application.DTOs.Response;
using dev.Domain.Common;

namespace dev.Domain.Entities;

public class ResponseEntity : BaseEntity
{
    public int StatusCode { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public Dictionary<string, string> Headers { get; set; } = new Dictionary<string, string>();
    public int ResponseTime { get; set; }
    public int ResponseSize { get; set; }
    public object? Body { get; set; }
    
    public int RequestId { get; set; }
    public RequestEntity Request { get; set; }
}