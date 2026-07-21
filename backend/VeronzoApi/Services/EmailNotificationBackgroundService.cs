namespace VeronzoApi.Services;

public class EmailNotificationBackgroundService(
    IEmailNotificationQueue queue,
    IServiceScopeFactory scopeFactory,
    ILogger<EmailNotificationBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var request in queue.DequeueAllAsync(stoppingToken))
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var emailSender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
                await emailSender.SendContactNotificationAsync(request, stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Не удалось отправить email-уведомление по заявке #{Id} из фоновой очереди", request.Id);
            }
        }
    }
}
