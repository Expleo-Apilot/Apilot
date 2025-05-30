using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using dev.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text;

namespace dev.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly string _smtpServer;
    private readonly int _smtpPort;
    private readonly string _smtpUsername;
    private readonly string _smtpPassword;
    private readonly string _senderEmail;
    private readonly string _senderName;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        
        _smtpServer = _configuration["EmailSettings:SmtpServer"];
        _smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"]);
        _smtpUsername = _configuration["EmailSettings:SmtpUsername"];
        _smtpPassword = _configuration["EmailSettings:SmtpPassword"];
        _senderEmail = _configuration["EmailSettings:SenderEmail"];
        _senderName = _configuration["EmailSettings:SenderName"];
    }

    public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = false)
    {
        try
        {
            var message = new MailMessage
            {
                From = new MailAddress(_senderEmail, _senderName),
                Subject = subject,
                Body = body,
                IsBodyHtml = isHtml
            };
            
            message.To.Add(new MailAddress(to));

            using var client = new SmtpClient(_smtpServer, _smtpPort)
            {
                Credentials = new NetworkCredential(_smtpUsername, _smtpPassword),
                EnableSsl = true
            };

            await client.SendMailAsync(message);
            _logger.LogInformation("Email sent successfully to {Email}", to);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", to);
            throw;
        }
    }

    public async Task SendVerificationCodeAsync(string to, string code, string username)
    {
        string subject = "Apilot - Email Verification Code";
        
        string body = $@"
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4a56e2; color: white; padding: 15px; text-align: center; }}
                .content {{ padding: 20px; border: 1px solid #ddd; }}
                .code {{ font-size: 24px; font-weight: bold; text-align: center; 
                         margin: 20px 0; padding: 10px; background-color: #f5f5f5; }}
                .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #777; }}
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>Apilot Email Verification</h2>
                </div>
                <div class='content'>
                    <p>Hello {username},</p>
                    <p>Thank you for registering with Apilot. To complete your registration, please use the verification code below:</p>
                    <div class='code'>{code}</div>
                    <p>This code will expire in 3 minutes. If the code expires, you can request a new one.</p>
                    <p>If you did not request this code, please ignore this email.</p>
                </div>
                <div class='footer'>
                    <p>&copy; {DateTime.Now.Year} Apilot. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>";

        await SendEmailAsync(to, subject, body, true);
    }
    
    public async Task SendWelcomeEmailAsync(string to, string username, string firstName, string lastName)
    {
        string subject = "Welcome to Apilot!";
        
        StringBuilder bodyBuilder = new StringBuilder();
        bodyBuilder.Append(@"<html>        
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4a56e2; color: white; padding: 15px; text-align: center; }
                .content { padding: 20px; border: 1px solid #ddd; }
                .welcome { font-size: 20px; font-weight: bold; margin-bottom: 20px; }
                .button { display: inline-block; background-color: #4a56e2; color: white; 
                         padding: 10px 20px; text-decoration: none; border-radius: 5px; 
                         margin: 20px 0; }
                .features { margin: 20px 0; }
                .feature { margin-bottom: 10px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>Welcome to Apilot</h2>
                </div>
                <div class='content'>");

        bodyBuilder.Append($@"<p>Hello {firstName} {lastName},</p>
                    <div class='welcome'>Your email has been successfully verified!</div>
                    <p>Thank you for joining Apilot, the powerful API development and testing platform. Your account is now fully activated and ready to use.</p>
                    <p>With Apilot, you can:</p>
                    <div class='features'>
                        <div class='feature'>✓ Create and organize API requests in collections</div>
                        <div class='feature'>✓ Test APIs with various authentication methods</div>
                        <div class='feature'>✓ Save and reuse requests for faster development</div>
                        <div class='feature'>✓ Manage environments and variables</div>
                        <div class='feature'>✓ Import OpenAPI/Swagger specifications</div>
                    </div>
                    <p>We're excited to have you on board and can't wait to see what you'll build with Apilot!</p>
                    <a href='https://apilot.com/dashboard' class='button'>Get Started Now</a>
                    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                    <p>Happy API testing!</p>
                    <p>The Apilot Team</p>
                </div>
                <div class='footer'>
                    <p>&copy; {DateTime.Now.Year} Apilot. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>");

        await SendEmailAsync(to, subject, bodyBuilder.ToString(), true);
    }
}
