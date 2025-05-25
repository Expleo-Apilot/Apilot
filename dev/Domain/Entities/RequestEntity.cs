using Apilot.Domain.Enums;
using dev.Application.DTOs.AuthenticationDto;
using dev.Domain.Common;

namespace dev.Domain.Entities;

public class RequestEntity : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public ApiHttpMethod HttpMethod { get; set; }
    public string Url { get; set; } = string.Empty;
    public required Dictionary<string, string> Headers { get; set; }
    public AuthenticationDto? Authentication { get; set; }
    public object? Body { get; set; }
    public Dictionary<string, string>? Parameters { get; set; } = new Dictionary<string, string>();
    
    
    public int? FolderId { get; set; }
    public Folder Folder { get; set; } = null!;
    public int? CollectionId { get; set; }
    public Collection Collection { get; set; } = null!;
    
    public List<ResponseEntity> Responses { get; set; } = new List<ResponseEntity>();
}