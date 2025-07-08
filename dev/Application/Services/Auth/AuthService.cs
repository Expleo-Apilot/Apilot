using dev.Application.DTOs.Auth;
using dev.Application.Interfaces;
using dev.Domain.Entities;
using dev.Infrastructure.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace dev.Application.Services.Auth;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IEmailService _emailService;
    private readonly IEmailVerificationService _emailVerificationService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        RoleManager<IdentityRole> roleManager,
        IJwtTokenService jwtTokenService,
        IEmailService emailService,
        IEmailVerificationService emailVerificationService,
        ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
        _jwtTokenService = jwtTokenService;
        _emailService = emailService;
        _emailVerificationService = emailVerificationService;
        _logger = logger;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        _logger.LogInformation("Registering new user with email: {Email}", request.Email);

        var existingUserByEmail = await _userManager.FindByEmailAsync(request.Email);
        if (existingUserByEmail != null)
        {
            _logger.LogWarning("Registration failed: Email {Email} already exists", request.Email);
            return new AuthResponse
            {
                Success = false,
                Message = "User with this email already exists."
            };
        }

        var existingUserByUsername = await _userManager.FindByNameAsync(request.Username);
        if (existingUserByUsername != null)
        {
            _logger.LogWarning("Registration failed: Username {Username} already exists", request.Username);
            return new AuthResponse
            {
                Success = false,
                Message = "User with this username already exists."
            };
        }

        var user = new ApplicationUser
        {
            UserName = request.Username,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            CreatedAt = DateTime.UtcNow,
            IsEmailVerified = false // Set email as not verified initially
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            _logger.LogWarning("Registration failed: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
            return new AuthResponse
            {
                Success = false,
                Message = string.Join(", ", result.Errors.Select(e => e.Description))
            };
        }

        await AssignRoleAsync(user.Id, "User");

        try
        {
            // Generate verification code and send email
            var verificationCode = await _emailVerificationService.GenerateVerificationCodeAsync(user.Email, user.Id);
            await _emailService.SendVerificationCodeAsync(user.Email, verificationCode, user.UserName);
            _logger.LogInformation("Verification code sent to {Email}", user.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email to {Email}", user.Email);
            // Continue with registration even if email sending fails
        }

        // Generate token for initial access (limited until email verification)
        var token = await _jwtTokenService.GenerateJwtToken(user);
        var roles = await _userManager.GetRolesAsync(user);

        _logger.LogInformation("User registered successfully: {Username}", user.UserName);
        return new AuthResponse
        {
            Success = true,
            Message = "Registration successful. Please check your email for a verification code to complete the registration process.",
            Token = token,
            UserId = user.Id,
            Username = user.UserName,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roles.ToList(),
            IsEmailVerified = false,
            RequiresEmailVerification = true
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        _logger.LogInformation("Login attempt for email: {Email}", request.Email);

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            _logger.LogWarning("Login failed: User with email {Email} not found", request.Email);
            return new AuthResponse
            {
                Success = false,
                Message = "Invalid email or password."
            };
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        if (!result.Succeeded)
        {
            _logger.LogWarning("Login failed: Invalid password for user {Email}", request.Email);
            return new AuthResponse
            {
                Success = false,
                Message = "Invalid email or password."
            };
        }

        // Check if email is verified
        bool isEmailVerified = await _emailVerificationService.IsEmailVerifiedAsync(user.Id) || user.IsEmailVerified;

        // Update user's email verification status if needed
        if (isEmailVerified && !user.IsEmailVerified)
        {
            user.IsEmailVerified = true;
            await _userManager.UpdateAsync(user);
        }

        var token = await _jwtTokenService.GenerateJwtToken(user);
        var roles = await _userManager.GetRolesAsync(user);

        _logger.LogInformation("User {Email} logged in successfully", user.Email);
        return new AuthResponse
        {
            Success = true,
            Message = isEmailVerified ? "Login successful." : "Login successful. Please verify your email to access all features.",
            Token = token,
            UserId = user.Id,
            Username = user.UserName,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roles.ToList(),
            IsEmailVerified = isEmailVerified,
            RequiresEmailVerification = !isEmailVerified
        };
    }

    public async Task<bool> AssignRoleAsync(string userId, string roleName)
    {
        var roleExists = await _roleManager.RoleExistsAsync(roleName);
        if (!roleExists)
        {
            await _roleManager.CreateAsync(new IdentityRole(roleName));
        }

        // Find user
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return false;
        }

        if (!await _userManager.IsInRoleAsync(user, roleName))
        {
            await _userManager.AddToRoleAsync(user, roleName);
        }

        return true;
    }
    
    public async Task<AuthResponse> VerifyEmailAsync(VerifyEmailRequest request)
    {
        _logger.LogInformation("Verifying email for: {Email}", request.Email);
        
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            _logger.LogWarning("Email verification failed: User with email {Email} not found", request.Email);
            return new AuthResponse
            {
                Success = false,
                Message = "User not found."
            };
        }
        
        bool isVerified = await _emailVerificationService.VerifyEmailAsync(request.Email, request.VerificationCode);
        if (!isVerified)
        {
            _logger.LogWarning("Email verification failed: Invalid or expired code for {Email}", request.Email);
            return new AuthResponse
            {
                Success = false,
                Message = "Invalid or expired verification code."
            };
        }
        
        // Update user's email verification status
        user.IsEmailVerified = true;
        await _userManager.UpdateAsync(user);
        
        try
        {
            // Send welcome email to the user
            await _emailService.SendWelcomeEmailAsync(
                user.Email,
                user.UserName,
                user.FirstName,
                user.LastName
            );
            _logger.LogInformation("Welcome email sent to: {Email}", user.Email);
        }
        catch (Exception ex)
        {
            // Log the error but continue with the verification process
            _logger.LogError(ex, "Failed to send welcome email to {Email}", user.Email);
        }
        
        // Generate a new token now that the email is verified
        var token = await _jwtTokenService.GenerateJwtToken(user);
        var roles = await _userManager.GetRolesAsync(user);
        
        _logger.LogInformation("Email verified successfully for user: {Email}", user.Email);
        return new AuthResponse
        {
            Success = true,
            Message = "Email verified successfully. Welcome to Apilot!",
            Token = token,
            UserId = user.Id,
            Username = user.UserName,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roles.ToList(),
            IsEmailVerified = true,
            RequiresEmailVerification = false
        };
    }
    
    public async Task<bool> ResendVerificationCodeAsync(string email)
    {
        _logger.LogInformation("Resending verification code for: {Email}", email);
        
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            _logger.LogWarning("Resend verification failed: User with email {Email} not found", email);
            return false;
        }
        
        // Check if email is already verified
        if (user.IsEmailVerified || await _emailVerificationService.IsEmailVerifiedAsync(user.Id))
        {
            _logger.LogInformation("Resend verification skipped: Email {Email} is already verified", email);
            return true; // Return true as there's no error, just already verified
        }
        
        try
        {
            // Generate new verification code and send email
            // The EmailVerificationService will handle checking for existing codes and their expiry
            var verificationCode = await _emailVerificationService.GenerateVerificationCodeAsync(email, user.Id);
            await _emailService.SendVerificationCodeAsync(email, verificationCode, user.UserName);
            
            _logger.LogInformation("Verification code resent to {Email}", email);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to resend verification code to {Email}", email);
            return false;
        }
    }
}
