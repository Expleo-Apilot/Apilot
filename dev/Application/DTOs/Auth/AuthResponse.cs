namespace dev.Application.DTOs.Auth;

public class AuthResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public string? Token { get; set; }
    public string? UserId { get; set; }
    public string? Username { get; set; }
    public string? Email { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public List<string> Roles { get; set; } = new List<string>();
}
