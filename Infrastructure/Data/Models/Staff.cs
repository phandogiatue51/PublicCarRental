using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PublicCarRental.Infrastructure.Data.Models
{
    public class Staff
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int StaffId { get; set; }
        public int AccountId { get; set; }
        public Account Account { get; set; }
        public int? StationId { get; set; }
        public Station Station { get; set; }
    }
}
