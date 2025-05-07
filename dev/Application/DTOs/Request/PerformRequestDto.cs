using Apilot.Domain.Enums;

namespace dev.Application.DTOs.Request;

public class PerformRequestDto
{
    public ApiHttpMethod HttpMethod { get; set; }
    public required string Url { get; set; }
    public required Dictionary<string, string> Headers { get; set; }
    public AuthenticationDto.AuthenticationDto? Authentication { get; set; }
    public object? Body { get; set; }
}