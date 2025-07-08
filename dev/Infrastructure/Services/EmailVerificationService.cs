using System;
using System.Security.Cryptography;
using System.Threading.Tasks;
using dev.Application.Interfaces;
using dev.Domain.Entities;
using dev.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace dev.Infrastructure.Services;

public class EmailVerificationService : IEmailVerificationService
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<EmailVerificationService> _logger;
    private const int CodeLength = 6;
    private const int CodeExpiryMinutes = 3; // Reduced from 30 to 3 minutes

    public EmailVerificationService(
        ApplicationDbContext context,
        IEmailService emailService,
        ILogger<EmailVerificationService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<string> GenerateVerificationCodeAsync(string email, string userId)
    {
        try
        {
            _logger.LogInformation("Generating verification code for email: {Email}", email);
            
            // Check if there's an existing verification record for this email
            var existingVerification = await _context.EmailVerifications
                .FirstOrDefaultAsync(v => v.Email == email);
            
            // Check if an existing code is still valid (not expired)
            if (existingVerification != null && existingVerification.ExpiryTime > DateTime.UtcNow)
            {
                // Calculate time remaining until code expires
                var timeRemaining = existingVerification.ExpiryTime - DateTime.UtcNow;
                _logger.LogInformation("Verification code request denied: Previous code for {Email} is still valid for {Seconds} seconds", 
                    email, timeRemaining.TotalSeconds);
                
                // Return the existing code - this prevents users from requesting multiple codes
                return existingVerification.VerificationCode;
            }
            
            // Generate a random 6-digit code
            string verificationCode = GenerateRandomCode(CodeLength);
            
            if (existingVerification != null)
            {
                // Update the existing record
                existingVerification.VerificationCode = verificationCode;
                existingVerification.ExpiryTime = DateTime.UtcNow.AddMinutes(CodeExpiryMinutes);
                existingVerification.IsVerified = false;
                existingVerification.UpdatedAt = DateTime.UtcNow;
                existingVerification.UpdatedBy = "System";
            }
            else
            {
                // Create a new verification record
                var emailVerification = new EmailVerification
                {
                    Email = email,
                    VerificationCode = verificationCode,
                    ExpiryTime = DateTime.UtcNow.AddMinutes(CodeExpiryMinutes),
                    IsVerified = false,
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System",
                    UpdatedAt = DateTime.UtcNow,
                    UpdatedBy = "System",
                    IsDeleted = false,
                    SyncId = Guid.NewGuid(),
                    IsSync = false
                };
                
                await _context.EmailVerifications.AddAsync(emailVerification);
            }
            
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Verification code generated successfully for email: {Email}", email);
            
            return verificationCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating verification code for email: {Email}", email);
            throw;
        }
    }

    public async Task<bool> VerifyEmailAsync(string email, string code)
    {
        try
        {
            _logger.LogInformation("Verifying code for email: {Email}", email);
            
            var verification = await _context.EmailVerifications
                .FirstOrDefaultAsync(v => v.Email == email && v.VerificationCode == code);
            
            if (verification == null)
            {
                _logger.LogWarning("Invalid verification code for email: {Email}", email);
                return false;
            }
            
            if (verification.ExpiryTime < DateTime.UtcNow)
            {
                _logger.LogWarning("Expired verification code for email: {Email}", email);
                return false;
            }
            
            verification.IsVerified = true;
            verification.UpdatedAt = DateTime.UtcNow;
            verification.UpdatedBy = "System";
            
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Email verified successfully: {Email}", email);
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying email: {Email}", email);
            throw;
        }
    }

    public async Task<bool> IsEmailVerifiedAsync(string userId)
    {
        try
        {
            var verification = await _context.EmailVerifications
                .FirstOrDefaultAsync(v => v.UserId == userId);
            
            return verification != null && verification.IsVerified;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if email is verified for user ID: {UserId}", userId);
            throw;
        }
    }

    private string GenerateRandomCode(int length)
    {
        // Generate a cryptographically secure random number for the verification code
        using var rng = RandomNumberGenerator.Create();
        byte[] randomNumber = new byte[length];
        rng.GetBytes(randomNumber);
        
        // Convert to a numeric string of specified length
        return Convert.ToBase64String(randomNumber)
            .Replace("/", "")
            .Replace("+", "")
            .Replace("=", "")
            .Substring(0, length)
            .ToUpper();
    }
}
