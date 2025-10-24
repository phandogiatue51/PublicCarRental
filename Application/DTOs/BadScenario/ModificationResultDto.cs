using PublicCarRental.Application.DTOs.Cont;

namespace PublicCarRental.Application.DTOs.BadScenario
{
    public class ModificationResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public decimal PriceDifference { get; set; }
        public int? NewInvoiceId { get; set; }   
        public decimal? RefundAmount { get; set; } 
        public ContractDto UpdatedContract { get; set; }
    }

}
