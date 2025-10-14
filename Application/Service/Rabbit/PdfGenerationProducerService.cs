using PublicCarRental.Application.DTOs.Message;

namespace PublicCarRental.Application.Service.Rabbit
{
    public class PdfGenerationProducerService
    {
        private readonly BaseMessageProducer _messageProducer;
        private readonly ILogger<PdfGenerationProducerService> _logger;
        private readonly string _queueName = "pdf_generation_queue";

        public PdfGenerationProducerService(BaseMessageProducer messageProducer, ILogger<PdfGenerationProducerService> logger)
        {
            _messageProducer = messageProducer;
            _logger = logger;
        }

        public async Task PublishPdfGenerationAsync(int contractId, string renterEmail, string renterName)
        {
            var pdfEvent = new PdfGenerationEvent
            {
                ContractId = contractId,
                RenterEmail = renterEmail,
                RenterName = renterName
            };

            await _messageProducer.PublishMessageAsync(pdfEvent, _queueName);
            _logger.LogInformation("PDF generation queued for contract {ContractId}", contractId);
        }
    }
}
