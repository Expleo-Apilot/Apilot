using System.Security.Claims;
using dev.Domain.Entities;

namespace dev.Infrastructure.Auth;

public interface IJwtTokenService
{
    Task<string> GenerateJwtToken(ApplicationUser user);
    ClaimsPrincipal? ValidateToken(string token);
}
