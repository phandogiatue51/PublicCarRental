namespace PublicCarRental.Application.DTOs.Cont
{
    public class FinishContractDto
    {
        public int ContractId { get; set; }
        public IFormFile? imageFile { get; set; }
    }
}
