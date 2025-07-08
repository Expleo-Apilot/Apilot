using dev.Application.DTOs.Auth;
using dev.Application.Services.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace dev.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        _logger.LogInformation("Registration request received for email: {Email}", request.Email);
        
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Registration request validation failed");
            return BadRequest(ModelState);
        }

        var result = await _authService.RegisterAsync(request);
        if (!result.Success)
        {
            _logger.LogWarning("Registration failed: {Message}", result.Message);
            return BadRequest(result);
        }

        _logger.LogInformation("Registration successful for email: {Email}", request.Email);
        return Ok(result);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        _logger.LogInformation("Login request received for email: {Email}", request.Email);
        
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Login request validation failed");
            return BadRequest(ModelState);
        }

        var result = await _authService.LoginAsync(request);
        if (!result.Success)
        {
            _logger.LogWarning("Login failed for email: {Email}", request.Email);
            return Unauthorized(result);
        }

        _logger.LogInformation("Login successful for email: {Email}", request.Email);
        return Ok(result);
    }
    
    [HttpPost("verify-email")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        _logger.LogInformation("Email verification request received for: {Email}", request.Email);
        
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Email verification request validation failed");
            return BadRequest(ModelState);
        }

        var result = await _authService.VerifyEmailAsync(request);
        if (!result.Success)
        {
            _logger.LogWarning("Email verification failed: {Message}", result.Message);
            return BadRequest(result);
        }

        _logger.LogInformation("Email verification successful for: {Email}", request.Email);
        return Ok(result);
    }
    
    [HttpPost("resend-verification")]
    [AllowAnonymous]
    public async Task<IActionResult> ResendVerificationCode([FromBody] ResendVerificationRequest request)
    {
        _logger.LogInformation("Resend verification code request received for: {Email}", request.Email);
        
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Resend verification request validation failed");
            return BadRequest(ModelState);
        }

        try
        {
            var result = await _authService.ResendVerificationCodeAsync(request.Email);
            if (!result)
            {
                _logger.LogWarning("Resend verification code failed for: {Email}", request.Email);
                return BadRequest(new { 
                    Success = false, 
                    Message = "Please wait 3 minutes before requesting a new verification code." 
                });
            }

            _logger.LogInformation("Verification code resent successfully to: {Email}", request.Email);
            return Ok(new { 
                Success = true, 
                Message = "Verification code sent successfully. Please check your email. The code will expire in 3 minutes." 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resending verification code to {Email}", request.Email);
            return StatusCode(500, new { 
                Success = false, 
                Message = "An error occurred while processing your request. Please try again later." 
            });
        }
    }
}
