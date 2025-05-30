using System.ComponentModel.DataAnnotations;

namespace dev.Application.DTOs.Auth;

public class ResendVerificationRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
