using VeronzoApi.Models;

namespace VeronzoApi.Services;

public interface IEmailNotificationQueue
{
    void Enqueue(ContactRequest request);

    IAsyncEnumerable<ContactRequest> DequeueAllAsync(CancellationToken cancellationToken);
}
