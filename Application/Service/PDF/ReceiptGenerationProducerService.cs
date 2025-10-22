using PublicCarRental.Application.DTOs.Message;

namespace PublicCarRental.Application.Service.PDF
{
    public interface IReceiptGenerationProducerService
    {
        Task PublishReceiptGenerationAsync(int invoiceId, int contractId, int renterId, string renterEmail, string renterName);
    }

    public class ReceiptGenerationProducerService : IReceiptGenerationProducerService
    {
        private readonly BaseMessageProducer _messageProducer;
        private readonly ILogger<ReceiptGenerationProducerService> _logger;
        private readonly string _queueName = "receipt_generation_queue";

        public ReceiptGenerationProducerService(BaseMessageProducer messageProducer, ILogger<ReceiptGenerationProducerService> logger)
        {
            _messageProducer = messageProducer;
            _logger = logger;
        }

        public async Task PublishReceiptGenerationAsync(int invoiceId, int contractId, int renterId, string renterEmail, string renterName)
        {
            try
            {
                _logger.LogInformation("📧 Publishing receipt generation event for Invoice {InvoiceId}, Contract {ContractId}, Renter {RenterId}", 
                    invoiceId, contractId, renterId);

                var receiptEvent = new ReceiptGenerationEvent
                {
                    InvoiceId = invoiceId,
                    ContractId = contractId,
                    RenterId = renterId,
                    RenterEmail = renterEmail,
                    RenterName = renterName   
                };

                await _messageProducer.PublishMessageAsync(receiptEvent, _queueName);
                
                _logger.LogInformation("✅ Receipt generation event published successfully for Invoice {InvoiceId}", invoiceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to publish receipt generation event for Invoice {InvoiceId}", invoiceId);
                throw;
            }
        }
    }
}
