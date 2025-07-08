using dev.Application.DTOs.Auth;

namespace dev.Application.Services.Auth;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<bool> AssignRoleAsync(string userId, string roleName);
    Task<AuthResponse> VerifyEmailAsync(VerifyEmailRequest request);
    Task<bool> ResendVerificationCodeAsync(string email);
}
