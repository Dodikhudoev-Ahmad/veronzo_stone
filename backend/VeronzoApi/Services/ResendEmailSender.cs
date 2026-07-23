using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using VeronzoApi.Models;

namespace VeronzoApi.Services;

public class ResendEmailSender(HttpClient httpClient, IOptions<ResendOptions> options, ILogger<ResendEmailSender> logger) : IEmailSender
{
    private readonly ResendOptions _options = options.Value;

    public async Task SendContactNotificationAsync(ContactRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey) || string.IsNullOrWhiteSpace(_options.NotifyToAddress))
        {
            logger.LogWarning("Resend не настроен — уведомление по заявке #{Id} не отправлено", request.Id);
            return;
        }

        var text = $"""
            Новая заявка с сайта veronzotj.netlify.app

            Имя: {request.Name}
            Телефон/контакт: {request.Contact}
            Email: {request.Email}
            Интересует: {request.Type}
            Сообщение: {request.Message}

            Получено: {request.CreatedAtUtc:yyyy-MM-dd HH:mm} UTC
            """;

        var payload = new
        {
            from = $"{_options.FromName} <{_options.FromAddress}>",
            to = new[] { _options.NotifyToAddress },
            reply_to = !string.IsNullOrWhiteSpace(request.Email) ? request.Email : null,
            subject = $"Новая заявка с сайта Veronzo — {request.Name}",
            text
        };

        try
        {
            var json = JsonSerializer.Serialize(payload);
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "emails")
            {
                // StringContent sets Content-Length explicitly, unlike JsonContent which
                // streams the body chunked — some HTTP intermediaries mishandle that.
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);

            using var response = await httpClient.SendAsync(httpRequest, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                logger.LogError(
                    "Resend вернул ошибку {StatusCode} по заявке #{Id}: {Body}",
                    response.StatusCode, request.Id, body);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Не удалось отправить email-уведомление через Resend по заявке #{Id}", request.Id);
        }
    }
}
