using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.Service
{
    public interface IHelperService
    {
        public RentalContract GetContractById(int contractId);
        public int AutoCancelOverdueInvoices();
        public double CalculateStationUtilizationRate(int stationId, List<Vehicle> vehicles, List<RentalContract> contracts);
        public double CalculateModelUtilizationRate(int modelId, ICollection<Vehicle> vehicles);
        public decimal CalculateAverageRevenueForSegment(List<int> customerIds, List<Invoice> invoices);
        public string CalculateRiskLevel(EVRenter customer, int accidentCount);
        public double CalculateSatisfactionScore(int staffId);

    }
}
