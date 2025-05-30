using System.Threading.Tasks;

namespace dev.Application.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body, bool isHtml = false);
    Task SendVerificationCodeAsync(string to, string code, string username);
    Task SendWelcomeEmailAsync(string to, string username, string firstName, string lastName);
}
