using PublicCarRental.Service.Inv;

namespace PublicCarRental.Service
{
    public class InvoiceCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public InvoiceCleanupService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using var scope = _scopeFactory.CreateScope();
                var helperService = scope.ServiceProvider.GetRequiredService<IHelperService>();
                var count = helperService.AutoCancelOverdueInvoices();

                Console.WriteLine($"Auto-cancelled {count} contracts at {DateTime.UtcNow}");

                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }
    }

}
