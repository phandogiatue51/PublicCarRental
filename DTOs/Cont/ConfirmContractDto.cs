namespace PublicCarRental.DTOs.Cont
{
    public class ConfirmContractDto
    {
        public int StaffId { get; set; }
        public int ContractId { get; set; }

        public IFormFile? imageFile { get; set; }
    }
}
