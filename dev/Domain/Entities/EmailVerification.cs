using System;
using dev.Domain.Common;

namespace dev.Domain.Entities;

public class EmailVerification : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string VerificationCode { get; set; } = string.Empty;
    public DateTime ExpiryTime { get; set; }
    public bool IsVerified { get; set; }
    public string UserId { get; set; } = string.Empty;
}
