using BasketballTournamentsApp.Models;
using Microsoft.Extensions.Options; 
using MimeKit;                      
using MailKit.Net.Smtp;             
using MailKit.Security;

namespace BasketballTournamentsApp.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailConfiguration _emailConfig;

        public EmailService(IOptions<EmailConfiguration> emailConfig)
        {
            _emailConfig = emailConfig.Value;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            var email = new MimeMessage();
            email.From.Add(new MailboxAddress(_emailConfig.SenderName, _emailConfig.SenderEmail));
            email.To.Add(MailboxAddress.Parse(toEmail));
            email.Subject = subject;

            var builder = new BodyBuilder { HtmlBody = htmlBody };
            email.Body = builder.ToMessageBody();

            using var smtp = new SmtpClient();
            try
            {
                await smtp.ConnectAsync(_emailConfig.SmtpServer, _emailConfig.SmtpPort, SecureSocketOptions.StartTls);
                await smtp.AuthenticateAsync(_emailConfig.SenderEmail, _emailConfig.Password);

                await smtp.SendAsync(email);
            }
            finally
            {
                await smtp.DisconnectAsync(true);
            }
        }
    }
}