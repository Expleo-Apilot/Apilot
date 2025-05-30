using System.Threading.Tasks;
using dev.Application.DTOs.Auth;

namespace dev.Application.Interfaces;

public interface IEmailVerificationService
{
    Task<string> GenerateVerificationCodeAsync(string email, string userId);
    Task<bool> VerifyEmailAsync(string email, string code);
    Task<bool> IsEmailVerifiedAsync(string userId);
}
