using System.Threading.Channels;
using VeronzoApi.Models;

namespace VeronzoApi.Services;

public class EmailNotificationQueue : IEmailNotificationQueue
{
    private readonly Channel<ContactRequest> _channel = Channel.CreateUnbounded<ContactRequest>();

    public void Enqueue(ContactRequest request) => _channel.Writer.TryWrite(request);

    public IAsyncEnumerable<ContactRequest> DequeueAllAsync(CancellationToken cancellationToken) =>
        _channel.Reader.ReadAllAsync(cancellationToken);
}
