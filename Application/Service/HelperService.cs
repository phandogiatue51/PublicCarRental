using PublicCarRental.Application.Service;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Cont;
using PublicCarRental.Infrastructure.Data.Repository.Inv;

public class HelperService : IHelperService
{
    private readonly IContractRepository _contractRepo;
    private readonly IInvoiceRepository _invoiceRepo;
    private readonly IRatingRepository _ratingRepo;

    public HelperService(IContractRepository contractRepo, IInvoiceRepository invoiceRepo, IRatingRepository ratingRepo)
    {
        _contractRepo = contractRepo;
        _invoiceRepo = invoiceRepo;
        _ratingRepo = ratingRepo;
    }

    public RentalContract GetContractById(int contractId)
    {
        return _contractRepo.GetById(contractId);
    }

    public int AutoCancelOverdueInvoices()
    {
        var invoices = _invoiceRepo.GetAll();

        if (invoices == null || !invoices.Any())
            return 0;

        var overdueInvoices = invoices
            .Where(i => i.Status == InvoiceStatus.Pending && DateTime.UtcNow > i.IssuedAt.AddMinutes(30))
            .ToList();

        int cancelledCount = 0;

        foreach (var invoice in overdueInvoices)
        {
            invoice.Status = InvoiceStatus.Overdue;
            _invoiceRepo.Update(invoice);

            var contract = _contractRepo.GetById((int)invoice.ContractId);
            if (contract != null && contract.Status == RentalStatus.ToBeConfirmed)
            {
                contract.Status = RentalStatus.Cancelled;
                _contractRepo.Update(contract);
                cancelledCount++;
            }
        }

        return cancelledCount;
    }

    public double CalculateStationUtilizationRate(int stationId, List<Vehicle> vehicles, List<RentalContract> contracts)
    {
        var stationVehicles = vehicles.Count(v => v.StationId == stationId);
        if (stationVehicles == 0) return 0;

        var activeRentals = contracts.Count(rc => rc.StationId == stationId &&
                                                rc.Status == RentalStatus.Active);
        return Math.Round((double)activeRentals / stationVehicles * 100, 2);
    }

    public double CalculateModelUtilizationRate(int modelId, ICollection<Vehicle> vehicles)
    {
        var totalVehicles = vehicles.Count;
        if (totalVehicles == 0) return 0;

        var rentedVehicles = vehicles.Count(v => v.Status == VehicleStatus.Renting);
        return Math.Round((double)rentedVehicles / totalVehicles * 100, 2);
    }

    public decimal CalculateAverageRevenueForSegment(List<int> customerIds, List<Invoice> invoices)
    {
        if (!customerIds.Any()) return 0;

        var segmentRevenue = invoices
            .Where(i => i.Contract != null && customerIds.Contains(i.Contract.EVRenterId))
            .Sum(i => i.AmountPaid ?? 0);

        return segmentRevenue / customerIds.Count;
    }

    public string CalculateRiskLevel(EVRenter customer, int accidentCount)
    {
        var riskScore = 0;

        riskScore += accidentCount * 5;

        riskScore += customer.RentalContracts?
            .Count(rc => rc != null &&
                       rc.EndTime < DateTime.UtcNow &&
                       rc.Status == RentalStatus.Active) * 2 ?? 0;

        return riskScore switch
        {
            >= 10 => "High",
            >= 5 => "Medium",
            _ => "Low"
        };
    }

    public double CalculateSatisfactionScore(int staffId)
    {
        var staffContracts = _contractRepo.GetAll()
            .Where(rc => rc.StaffId == staffId)
            .Select(rc => rc.ContractId)
            .ToList();

        if (!staffContracts.Any()) return 0;

        var averageRating = _ratingRepo.GetAll()
            .Where(r => staffContracts.Contains(r.ContractId))
            .Average(r => (double?)(int)r.Stars) ?? 0;

        return Math.Round(averageRating, 1);
    }

}