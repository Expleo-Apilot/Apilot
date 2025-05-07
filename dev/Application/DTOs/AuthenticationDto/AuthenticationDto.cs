using Apilot.Domain.Enums;
using dev.Domain.Enums;

namespace dev.Application.DTOs.AuthenticationDto;

public class AuthenticationDto
{
    
    public required AuthType AuthType { get; set; }
    public required Dictionary<string, string> AuthData { get; set; } = new Dictionary<string, string>();
}