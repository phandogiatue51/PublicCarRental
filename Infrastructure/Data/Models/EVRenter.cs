using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PublicCarRental.Infrastructure.Data.Models
{
    public class EVRenter
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int RenterId { get; set; }
        public int AccountId { get; set; }
        public Account Account { get; set; }
        public string LicenseNumber { get; set; }

        public ICollection<RentalContract> RentalContracts { get; set; }
    }
}
