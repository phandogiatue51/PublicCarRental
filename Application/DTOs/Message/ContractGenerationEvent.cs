namespace PublicCarRental.Application.DTOs.Message
{
    public class ContractGenerationEvent
    {
        public int ContractId { get; set; }
        public string RenterEmail { get; set; }
        public string RenterName { get; set; }
        public bool IncludeStaffSignature { get; set; } = false;
        public string StaffName { get; set; } 
    }
}
