using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using VeronzoApi.Models;

namespace VeronzoApi.Services;

public class SmtpEmailSender(IOptions<SmtpOptions> options, ILogger<SmtpEmailSender> logger) : IEmailSender
{
    private readonly SmtpOptions _options = options.Value;

    public async Task SendContactNotificationAsync(ContactRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.Host) || string.IsNullOrWhiteSpace(_options.NotifyToAddress))
        {
            logger.LogWarning("SMTP не настроен — уведомление по заявке #{Id} не отправлено", request.Id);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.FromName, _options.FromAddress));
        message.To.Add(MailboxAddress.Parse(_options.NotifyToAddress));

        if (!string.IsNullOrWhiteSpace(request.Email) && MailboxAddress.TryParse(request.Email, out var replyTo))
        {
            message.ReplyTo.Add(replyTo);
        }

        message.Subject = $"Новая заявка с сайта Veronzo — {request.Name}";
        message.Body = new TextPart("plain")
        {
            Text = $"""
                Новая заявка с сайта veronzotj.netlify.app

                Имя: {request.Name}
                Телефон/контакт: {request.Contact}
                Email: {request.Email}
                Интересует: {request.Type}
                Сообщение: {request.Message}

                Получено: {request.CreatedAtUtc:yyyy-MM-dd HH:mm} UTC
                """
        };

        try
        {
            using var client = new SmtpClient();
            var socketOptions = _options.UseStartTls ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto;
            await client.ConnectAsync(_options.Host, _options.Port, socketOptions, cancellationToken);
            if (!string.IsNullOrWhiteSpace(_options.User))
            {
                await client.AuthenticateAsync(_options.User, _options.Password, cancellationToken);
            }
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Не удалось отправить email-уведомление по заявке #{Id}", request.Id);
        }
    }
}
