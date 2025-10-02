using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PublicCarRental.Models
{
    public enum RatingLabel
    {
        VeryBad = 1,
        Bad = 2,
        Normal = 3,
        Good = 4,
        Excellent = 5
    }

    public class Rating
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int RatingId { get; set; }

        public int ContractId { get; set; }
        [ForeignKey("ContractId")]
        public RentalContract Contract { get; set; }

        public RatingLabel Stars { get; set; }

        public string Comment { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
