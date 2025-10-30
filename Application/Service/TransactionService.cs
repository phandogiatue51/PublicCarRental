using Microsoft.EntityFrameworkCore;
using PublicCarRental.Application.DTOs;
using PublicCarRental.Application.DTOs.AdminDashboard;
using PublicCarRental.Application.DTOs.AdminDashboard.Revenue;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Cont;
using PublicCarRental.Infrastructure.Data.Repository.Inv;
using PublicCarRental.Infrastructure.Data.Repository.Trans;
using Transaction = PublicCarRental.Infrastructure.Data.Models.Transaction;

namespace PublicCarRental.Application.Service
{
    public class TransactionService : ITransactionService
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly IInvoiceRepository _invoiceRepository;

        public TransactionService(ITransactionRepository transactionRepository, IInvoiceRepository invoiceRepository) 
        {
            _transactionRepository = transactionRepository;
            _invoiceRepository = invoiceRepository;
        }

        public IEnumerable<TransactionDto> GetAll()
        {
            return _transactionRepository.GetAll()
                .Select(i => new TransactionDto
                {
                    TransactionId = i.TransactionId,
                    InvoiceId = i.InvoiceId,
                    Type = i.Type,
                    Amount = i.Amount,
                    Timestamp = i.Timestamp,
                    Note = i.Note,
                }).ToList(); 
        }

        public void CreateTransaction(int invoiceId, TransactionType type, string note)
        {
            var invoice = _invoiceRepository.GetById(invoiceId);
            var transaction = new Transaction
            {

                Type = type,
                InvoiceId = invoice.InvoiceId,
                Amount = (decimal)invoice.AmountPaid,
                Timestamp = DateTime.UtcNow,
                Note = note
            };
            _transactionRepository.Create(transaction);
        }
        public async Task<FinancialReportDto> GetFinancialReportAsync(DateRange dateRange)
        {
            var transactions = await _transactionRepository.GetAll()
                .Where(t => t.Timestamp >= dateRange.StartDate &&
                           t.Timestamp <= dateRange.EndDate)
                .Include(t => t.Invoice)
                    .ThenInclude(i => i.Contract)
                        .ThenInclude(c => c.Station)
                .Include(t => t.Invoice.Contract.Vehicle.Model.Type)
                .ToListAsync();

            var totalRevenue = transactions
                .Where(t => t.Type == TransactionType.Income)
                .Sum(t => t.Amount);

            var totalDeposits = transactions
                .Where(t => t.Type == TransactionType.Deposit)
                .Sum(t => t.Amount);

            var totalRefunds = transactions
                .Where(t => t.Type == TransactionType.Refund)
                .Sum(t => t.Amount);

            var revenueByStation = transactions
                .Where(t => t.Type == TransactionType.Income &&
                           t.Invoice?.Contract?.StationId != null)
                .GroupBy(t => new { t.Invoice.Contract.StationId, t.Invoice.Contract.Station.Name })
                .Select(g => new RevenueByStationDto
                {
                    StationId = (int)g.Key.StationId,
                    StationName = g.Key.Name,
                    Revenue = g.Sum(t => t.Amount),
                    TotalRentals = g.Count()
                })
                .OrderByDescending(r => r.Revenue)
                .ToList();

            var dailyRevenue = transactions
                .Where(t => t.Type == TransactionType.Income)
                .GroupBy(t => t.Timestamp.Date)
                .Select(g => new DailyRevenueDto
                {
                    Date = g.Key,
                    Revenue = g.Sum(t => t.Amount),
                    RentalCount = g.Count()
                })
                .OrderBy(d => d.Date)
                .ToList();

            var revenueByVehicleType = transactions
                .Where(t => t.Type == TransactionType.Income &&
                           t.Invoice?.Contract?.Vehicle?.Model != null)
                .GroupBy(t => t.Invoice.Contract.Vehicle.Model.Type.Name)
                .Select(g => new RevenueByVehicleTypeDto
                {
                    VehicleType = g.Key,
                    Revenue = g.Sum(t => t.Amount),
                    RentalCount = g.Count(),
                    MarketShare = totalRevenue > 0 ? (g.Sum(t => t.Amount) / totalRevenue * 100) : 0
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

        // Additional useful methods:
        public async Task<decimal> GetTotalIncomeAsync(DateTime startDate, DateTime endDate)
        {
            return await _transactionRepository.GetAll()
                .Where(t => t.Type == TransactionType.Income &&
                           t.Timestamp >= startDate &&
                           t.Timestamp <= endDate)
                .SumAsync(t => t.Amount);
        }
    }

    public interface ITransactionService
    {
        public IEnumerable<TransactionDto> GetAll();
        public void CreateTransaction(int invoiceId, TransactionType type, string note);
        Task<FinancialReportDto> GetFinancialReportAsync(DateRange dateRange);
        Task<decimal> GetTotalIncomeAsync(DateTime startDate, DateTime endDate);
    }
}
