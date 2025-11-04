namespace PublicCarRental.Application.DTOs.Accident
{
    public class ConfirmReplacementRequest
    {
        public int ContractId { get; set; }
        public string LockKey { get; set; }
        public string LockToken { get; set; }
    }
}
