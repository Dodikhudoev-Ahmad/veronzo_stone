using VeronzoApi.Models;

namespace VeronzoApi.Services;

public interface IEmailSender
{
    Task SendContactNotificationAsync(ContactRequest request, CancellationToken cancellationToken = default);
}
