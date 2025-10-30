using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Infrastructure.Data.Repository
{
    public class RefundRepository : IRefundRepository
    {
        private readonly EVRentalDbContext _context;

        public RefundRepository(EVRentalDbContext context)
        {
            _context = context;
        }
        public Refund GetById(int refundId)
        {
            return _context.Refunds.Find(refundId);
        }
        public Refund GetByInvoiceId(int invoiceId)
        {
            return _context.Refunds.FirstOrDefault(r => r.InvoiceId == invoiceId);
        }
        public IEnumerable<Refund> GetByStatus(RefundStatus status)
        {
            return _context.Refunds.Where(r => r.Status == status).ToList();
        }
        public void Create(Refund refund)
        {
            _context.Refunds.Add(refund);
            _context.SaveChanges();
        }
        public void Update(Refund refund)
        {
            _context.Refunds.Update(refund);
            _context.SaveChanges();
        }
    }

    public interface IRefundRepository
    {
        Refund GetById(int refundId);
        Refund GetByInvoiceId(int invoiceId);
        IEnumerable<Refund> GetByStatus(RefundStatus status);
        void Create(Refund refund);
        void Update(Refund refund);
    }
}
