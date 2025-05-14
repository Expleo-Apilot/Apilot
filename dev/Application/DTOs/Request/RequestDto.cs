using Apilot.Domain.Enums;
using dev.Application.DTOs.Response;

namespace dev.Application.DTOs.Request;

public class RequestDto
{
    public int Id { get; set; }
    public required string Name { get; set; } 
    public ApiHttpMethod HttpMethod { get; set; }
    public required string Url { get; set; } 
    public Dictionary<string, string> Headers { get; set; } = new();
    public AuthenticationDto.AuthenticationDto? Authentication { get; set; }
    public object? Body { get; set; }
    public Dictionary<string, string>? Parameters { get; set; } = new();
    
    public int? FolderId { get; set; }
    public int? CollectionId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    
    public List<ResponseDto> Responses { get; set; } =  new ();
}