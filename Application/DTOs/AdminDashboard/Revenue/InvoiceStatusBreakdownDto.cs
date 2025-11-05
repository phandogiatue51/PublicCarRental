using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs.AdminDashboard.Revenue
{
    public class InvoiceStatusBreakdownDto
    {
        public InvoiceStatus Status { get; set; }
        public int Count { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal Percentage { get; set; }
    }
}
