using Microsoft.EntityFrameworkCore;
using PublicCarRental.Application.DTOs.AdminDashboard;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Acc;
using PublicCarRental.Infrastructure.Data.Repository.Cont;
using PublicCarRental.Infrastructure.Data.Repository.Inv;
using PublicCarRental.Infrastructure.Data.Repository.Mod;
using PublicCarRental.Infrastructure.Data.Repository.Ren;
using PublicCarRental.Infrastructure.Data.Repository.Staf;
using PublicCarRental.Infrastructure.Data.Repository.Stat;
using PublicCarRental.Infrastructure.Data.Repository.Vehi;

namespace PublicCarRental.Application.Service.Dashboard
{
    public class AdminDashboardService : IAdminDashboardService
    {
        private readonly IStationRepository _stationRepository;
        private readonly IVehicleRepository _vehicleRepository;
        private readonly IAccountRepository _accountRepository;
        private readonly IContractRepository _contractRepository;
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IModelRepository _vehicleModelRepository;
        private readonly IHelperService _helperService;
        private readonly IEVRenterRepository _renterRepository;
        private readonly IRatingRepository _ratingRepository;
        private readonly IStaffRepository _staffRepository;

        private DateTime today => DateTime.UtcNow.Date;

        public AdminDashboardService(IStationRepository stationRepository,IVehicleRepository vehicleRepository, IAccountRepository accountRepository,
            IContractRepository contractRepository, IInvoiceRepository invoiceRepository, IModelRepository vehicleModelRepository,
            IHelperService helperService, IEVRenterRepository renterRepository, IRatingRepository ratingRepository, IStaffRepository staffRepository)
        {
            _stationRepository = stationRepository;
            _vehicleRepository = vehicleRepository;
            _accountRepository = accountRepository;
            _contractRepository = contractRepository;
            _invoiceRepository = invoiceRepository;
            _vehicleModelRepository = vehicleModelRepository;
            _helperService = helperService;
            _renterRepository = renterRepository;
            _ratingRepository = ratingRepository;
            _staffRepository = staffRepository;
        }

        public async Task<AdminOverviewDto> GetSystemOverviewAsync()
        {
            var firstDayOfMonth = new DateTime(today.Year, today.Month, 1);

            var totalStations = _stationRepository.GetAll().Count();
            var totalVehicles = _vehicleRepository.GetAll().Count();
            var totalCustomers = _accountRepository.GetAll()
                .Where(a => a.Role == AccountRole.EVRenter).Count();
            var totalStaff = _accountRepository.GetAll()
                .Where(a => a.Role == AccountRole.Staff).Count();

            var activeRentals = _contractRepository.GetAll()
                .Where(rc => rc.Status == RentalStatus.Active).Count();

            var todayRevenue = _invoiceRepository.GetAll()
                .Where(i => i.PaidAt.Value.Date == today && i.Status == InvoiceStatus.Paid)
                .Sum(i => i.AmountPaid ?? 0);

            var monthlyRevenue = _invoiceRepository.GetAll()
                .Where(i => i.PaidAt >= firstDayOfMonth && i.Status == InvoiceStatus.Paid)
                .Sum(i => i.AmountPaid ?? 0);

            var utilizationRate = totalVehicles > 0 ? (double)activeRentals / totalVehicles * 100 : 0;

            return new AdminOverviewDto
            {
                TotalStations = totalStations,
                TotalVehicles = totalVehicles,
                TotalCustomers = totalCustomers,
                TotalStaff = totalStaff,
                ActiveRentals = activeRentals,
                TodayRevenue = todayRevenue,
                MonthlyRevenue = monthlyRevenue,
                SystemUtilizationRate = Math.Round(utilizationRate, 2)
            };
        }

        public async Task<FleetManagementDto> GetFleetManagementAsync()
        {
            var vehicles = _vehicleRepository.GetAll().ToList();
            var stations = _stationRepository.GetAll().ToList();
            var rentalContracts = _contractRepository.GetAll().ToList();

            var vehicleDistribution = stations.Select(station => new VehicleDistributionDto
            {
                StationId = station.StationId,
                StationName = station.Name,
                StationAddress = station.Address,
                TotalVehicles = vehicles.Count(v => v.StationId == station.StationId),
                AvailableVehicles = vehicles.Count(v => v.StationId == station.StationId &&
                                                      v.Status == VehicleStatus.Available),
                RentedVehicles = vehicles.Count(v => v.StationId == station.StationId &&
                                                    v.Status == VehicleStatus.Renting),
                MaintenanceVehicles = vehicles.Count(v => v.StationId == station.StationId &&
                                                        (v.Status == VehicleStatus.InMaintenance ||
                                                         v.Status == VehicleStatus.ToBeCheckup)),
                UtilizationRate = _helperService.CalculateStationUtilizationRate(station.StationId, vehicles, rentalContracts)
            }).ToList();

            var modelPerformance = _vehicleModelRepository.GetAll()
                .Select(model => new VehicleModelPerformanceDto
                {
                    ModelId = model.ModelId,
                    ModelName = model.Name,
                    BrandName = model.Brand.Name,
                    TotalVehicles = model.Vehicles.Count,
                    TotalRentals = model.Vehicles.SelectMany(v => v.RentalContracts).Count(),
                    TotalRevenue = model.Vehicles.SelectMany(v => v.RentalContracts)
                                 .Where(rc => rc.Status == RentalStatus.Completed)
                                 .Sum(rc => rc.TotalCost ?? 0),
                    UtilizationRate = _helperService.CalculateModelUtilizationRate(model.ModelId, model.Vehicles)
                })
                .OrderByDescending(m => m.TotalRevenue)
                .Take(5)
                .ToList();

            return new FleetManagementDto
            {
                VehicleDistributionByStation = vehicleDistribution,
                AvailableVehicles = vehicles.Count(v => v.Status == VehicleStatus.Available),
                RentedVehicles = vehicles.Count(v => v.Status == VehicleStatus.Renting),
                MaintenanceVehicles = vehicles.Count(v => v.Status == VehicleStatus.InMaintenance ||
                                                        v.Status == VehicleStatus.ToBeCheckup),
                TopPerformingModels = modelPerformance
            };
        }

        public async Task<List<StationPerformanceDto>> GetStationsPerformanceAsync()
        {
            var stations = await _stationRepository.GetAll().ToListAsync();
            var vehicles = await _vehicleRepository.GetAll().ToListAsync();
            var rentalContracts = await _contractRepository.GetAll()
                .Where(rc => rc.Status == RentalStatus.Completed || rc.Status == RentalStatus.Active)
                .ToListAsync();
            var invoices = await _invoiceRepository.GetAll()
                .Where(i => i.Status == InvoiceStatus.Paid)
                .ToListAsync();

            var stationPerformance = stations.Select(station => new StationPerformanceDto
            {
                StationId = station.StationId,
                StationName = station.Name,
                TotalVehicles = vehicles.Count(v => v.StationId == station.StationId),
                ActiveRentals = rentalContracts.Count(rc => rc.StationId == station.StationId &&
                                                          rc.Status == RentalStatus.Active),
                Revenue = invoices.Where(i => i.Contract?.StationId == station.StationId)
                                 .Sum(i => i.AmountPaid ?? 0),
                UtilizationRate = _helperService.CalculateStationUtilizationRate(station.StationId, vehicles, rentalContracts)
            })
            .OrderByDescending(s => s.Revenue)
            .ToList();

            return stationPerformance;
        }

        public async Task<CustomerAnalyticsDto> GetCustomerAnalyticsAsync()
        {
            var customers = await _renterRepository.GetAll().ToListAsync();
            var rentalContracts = await _contractRepository.GetAll().ToListAsync();
            var invoices = await _invoiceRepository.GetAll()
                .Where(i => i.Status == InvoiceStatus.Paid)
                .ToListAsync();

            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            var firstDayOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);

            var totalCustomers = customers.Count;
            var newCustomersThisMonth = customers.Count(c => c.Account.RegisteredAt >= firstDayOfMonth);
            var activeCustomers = rentalContracts
                .Where(rc => rc.StartTime >= thirtyDaysAgo)
                .Select(rc => rc.EVRenterId)
                .Distinct()
                .Count();

            var averageRentalsPerCustomer = totalCustomers > 0 ?
                (double)rentalContracts.Count / totalCustomers : 0;

            var averageSpendingPerCustomer = totalCustomers > 0 ?
                invoices.Sum(i => i.AmountPaid ?? 0) / totalCustomers : 0;

            var customerSegments = new List<CustomerSegmentDto>
            {
                new CustomerSegmentDto
                {
                    Segment = "New",
                    Count = customers.Count(c => c.Account.RegisteredAt >= thirtyDaysAgo),
                    AverageRevenue = _helperService.CalculateAverageRevenueForSegment(customers.Where(c =>
                        c.Account.RegisteredAt >= thirtyDaysAgo).Select(c => c.RenterId).ToList(), invoices)
                },
                new CustomerSegmentDto
                {
                    Segment = "Regular",
                    Count = customers.Count(c => rentalContracts.Count(rc =>
                        rc.EVRenterId == c.RenterId) >= 3),
                    AverageRevenue = _helperService.CalculateAverageRevenueForSegment(customers.Where(c =>
                        rentalContracts.Count(rc => rc.EVRenterId == c.RenterId) >= 3)
                        .Select(c => c.RenterId).ToList(), invoices)
                },
                new CustomerSegmentDto
                {
                    Segment = "VIP",
                    Count = customers.Count(c => invoices.Where(i =>
                        i.Contract?.EVRenterId == c.RenterId).Sum(i => i.AmountPaid ?? 0) > 1000000), // > 1 million
                    AverageRevenue = _helperService.CalculateAverageRevenueForSegment(customers.Where(c =>
                        invoices.Where(i => i.Contract?.EVRenterId == c.RenterId).Sum(i => i.AmountPaid ?? 0) > 1000000)
                        .Select(c => c.RenterId).ToList(), invoices)
                },
                new CustomerSegmentDto
                {
                    Segment = "Inactive",
                    Count = customers.Count(c => !rentalContracts.Any(rc =>
                        rc.EVRenterId == c.RenterId && rc.StartTime >= thirtyDaysAgo)),
                    AverageRevenue = 0
                }
            };

            return new CustomerAnalyticsDto
            {
                TotalCustomers = totalCustomers,
                NewCustomersThisMonth = newCustomersThisMonth,
                ActiveCustomers = activeCustomers,
                AverageRentalsPerCustomer = Math.Round(averageRentalsPerCustomer, 2),
                AverageSpendingPerCustomer = Math.Round(averageSpendingPerCustomer, 2),
                CustomerSegments = customerSegments
            };
        }

        public async Task<List<RiskCustomerDto>> GetRiskCustomersAsync()
        {
            var customers = await _renterRepository.GetAll()
                .Include(r => r.Account)
                .Include(r => r.RentalContracts)
                .ThenInclude(rc => rc.Vehicle)
                .ToListAsync();

            var riskCustomers = customers.Select(customer => new RiskCustomerDto
            {
                CustomerId = customer.RenterId,
                FullName = customer.Account.FullName,
                Email = customer.Account.Email,
                PhoneNumber = customer.Account.PhoneNumber,
                LicenseNumber = customer.LicenseNumber,
                TotalRentals = customer.RentalContracts.Count,
                ViolationCount = customer.RentalContracts.Count(rc =>
                    rc.Note != null && (rc.Note.Contains("violation") || rc.Note.Contains("vi phạm"))),
                DamageReportCount = customer.RentalContracts.Count(rc =>
                    rc.Vehicle.AccidentReports.Any()),
                LateReturnCount = customer.RentalContracts.Count(rc =>
                    rc.EndTime < DateTime.UtcNow && rc.Status == RentalStatus.Active),
                RiskLevel = _helperService.CalculateRiskLevel(customer),
                LastRentalDate = customer.RentalContracts.Max(rc => rc.StartTime)
            })
            .Where(c => c.RiskLevel != "Low")
            .OrderByDescending(c => c.ViolationCount + c.DamageReportCount + c.LateReturnCount)
            .Take(10)
            .ToList();

            return riskCustomers;
        }

        public async Task<StaffPerformanceDto> GetStaffPerformanceAsync()
        {
            var staffMembers = _staffRepository.GetAll().ToList();

            var allContracts = await _contractRepository.GetAll().ToListAsync();
            var today = DateTime.UtcNow.Date;

            var staffPerformance = staffMembers.Select(staff =>
            {
                var staffContracts = allContracts.Where(rc => rc.StaffId == staff.StaffId).ToList();

                return new StaffMemberPerformanceDto
                {
                    StaffId = staff.StaffId,
                    FullName = staff.Account.FullName,
                    StationName = staff.Station?.Name ?? "Not Assigned",
                    TotalCheckIns = staffContracts.Count(rc => rc.EndTime.Date == today),
                    TotalCheckOuts = staffContracts.Count(rc => rc.StartTime.Date == today),
                    TotalRentalsProcessed = staffContracts.Count,
                    CustomerSatisfactionScore = _helperService.CalculateSatisfactionScore(staff.StaffId)
                };
            }).ToList();

            var totalStaff = staffMembers.Count;
            var activeStaff = staffMembers.Count(s => s.Account.Status == AccountStatus.Active);

            var topPerformers = staffPerformance
                .OrderByDescending(s => s.TotalRentalsProcessed)
                .Take(5)
                .ToList();

            var averageCheckIns = totalStaff > 0 ?
                (double)staffPerformance.Sum(s => s.TotalCheckIns) / totalStaff : 0;

            var averageCheckOuts = totalStaff > 0 ?
                (double)staffPerformance.Sum(s => s.TotalCheckOuts) / totalStaff : 0;

            return new StaffPerformanceDto
            {
                TotalStaff = totalStaff,
                ActiveStaff = activeStaff,
                TopPerformers = topPerformers,
                AverageCheckInsPerStaff = Math.Round(averageCheckIns, 2),
                AverageCheckOutsPerStaff = Math.Round(averageCheckOuts, 2)
            };
        }

        public async Task<FinancialReportDto> GetFinancialReportAsync(DateRange dateRange)
        {
            var paidInvoices = await _invoiceRepository.GetAll()
                .Where(i => i.PaidAt >= dateRange.StartDate &&
                           i.PaidAt <= dateRange.EndDate &&
                           i.Status == InvoiceStatus.Paid)
                .Include(i => i.Contract)
                .ThenInclude(c => c.Station)
                .Include(i => i.Contract.Vehicle.Model)
                .ToListAsync();

            var totalRevenue = paidInvoices.Sum(i => i.AmountPaid ?? 0);
            var totalDeposits = paidInvoices.Where(i => i.Note != null &&
                i.Note.Contains("deposit", StringComparison.OrdinalIgnoreCase))
                .Sum(i => i.AmountPaid ?? 0);
            var totalRefunds = paidInvoices.Where(i => i.Note != null &&
                i.Note.Contains("refund", StringComparison.OrdinalIgnoreCase))
                .Sum(i => i.AmountPaid ?? 0);

            var revenueByStation = paidInvoices
                .Where(i => i.Contract?.StationId != null)
                .GroupBy(i => new { i.Contract.StationId, i.Contract.Station.Name })
                .Select(g => new RevenueByStationDto
                {
                    StationId = (int)g.Key.StationId,
                    StationName = g.Key.Name,
                    Revenue = g.Sum(i => i.AmountPaid ?? 0),
                    TotalRentals = g.Count()
                })
                .OrderByDescending(r => r.Revenue)
                .ToList();

            var dailyRevenue = paidInvoices
                .GroupBy(i => i.PaidAt.Value.Date)
                .Select(g => new DailyRevenueDto
                {
                    Date = g.Key,
                    Revenue = g.Sum(i => i.AmountPaid ?? 0),
                    RentalCount = g.Count()
                })
                .OrderBy(d => d.Date)
                .ToList();

            var revenueByVehicleType = paidInvoices
                .Where(i => i.Contract?.Vehicle?.Model != null)
                .GroupBy(i => i.Contract.Vehicle.Model.Type.Name)
                .Select(g => new RevenueByVehicleTypeDto
                {
                    VehicleType = g.Key,
                    Revenue = g.Sum(i => i.AmountPaid ?? 0),
                    RentalCount = g.Count(),
                    MarketShare = totalRevenue > 0 ? (double)(g.Sum(i => i.AmountPaid ?? 0) / totalRevenue * 100) : 0
                })
                .OrderByDescending(r => r.Revenue)
                .ToList();

            return new FinancialReportDto
            {
                Period = dateRange,
                TotalRevenue = totalRevenue,
                TotalDeposits = totalDeposits,
                TotalRefunds = totalRefunds,
                NetRevenue = totalRevenue - totalRefunds,
                RevenueByStation = revenueByStation,
                DailyRevenue = dailyRevenue,
                RevenueByVehicleType = revenueByVehicleType
            };
        }

        public async Task<RatingAnalyticsDto> GetRatingAnalyticsAsync()
        {
            var ratings = _ratingRepository.GetAll().ToList();

            return new RatingAnalyticsDto
            {
                TotalRatings = ratings.Count,
                AverageRating = ratings.Any() ? Math.Round(ratings.Average(r => (int)r.Stars), 2) : 0,
                RatingDistribution = new List<RatingDistributionDto>
                {
                    new() { Stars = 5, Count = ratings.Count(r => r.Stars == RatingLabel.Excellent), Percentage = ratings.Count > 0 ? (double)ratings.Count(r => r.Stars == RatingLabel.Excellent) / ratings.Count * 100 : 0 },
                    new() { Stars = 4, Count = ratings.Count(r => r.Stars == RatingLabel.Good), Percentage = ratings.Count > 0 ? (double)ratings.Count(r => r.Stars == RatingLabel.Good) / ratings.Count * 100 : 0 },
                    new() { Stars = 3, Count = ratings.Count(r => r.Stars == RatingLabel.Normal), Percentage = ratings.Count > 0 ? (double)ratings.Count(r => r.Stars == RatingLabel.Normal) / ratings.Count * 100 : 0 },
                    new() { Stars = 2, Count = ratings.Count(r => r.Stars == RatingLabel.Bad), Percentage = ratings.Count > 0 ? (double)ratings.Count(r => r.Stars == RatingLabel.Bad) / ratings.Count * 100 : 0 },
                    new() { Stars = 1, Count = ratings.Count(r => r.Stars == RatingLabel.VeryBad), Percentage = ratings.Count > 0 ? (double)ratings.Count(r => r.Stars == RatingLabel.VeryBad) / ratings.Count * 100 : 0 }
                },
                RecentComments = ratings
                    .Where(r => !string.IsNullOrEmpty(r.Comment))
                    .OrderByDescending(r => r.CreatedAt)
                    .Take(10)
                    .Select(r => new RatingCommentDto
                    {
                        RenterName = r.Contract.EVRenter.Account.FullName,
                        Comment = r.Comment,
                        Stars = (int)r.Stars, 
                        CreatedAt = r.CreatedAt
                    })
                    .ToList()
            };
        }
    }
}

