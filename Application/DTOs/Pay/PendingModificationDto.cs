namespace PublicCarRental.Application.DTOs.Pay
{
    public class PendingModificationDto
    {
        public int ContractId { get; set; }
        public string ChangeType { get; set; }
        public int? NewVehicleId { get; set; }
        public DateTime? NewEndTime { get; set; }
        public decimal NewTotalCost { get; set; }
        public int InvoiceId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
