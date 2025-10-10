using Microsoft.EntityFrameworkCore;
using PublicCarRental.Infrastructure.Data.Models;

public interface IAccidentRepository
{
    public IQueryable<AccidentReport> GetAll();
    public void CreateAcc(AccidentReport report);
    public void UpdateAcc(AccidentReport report);
    public void DeleteAcc(AccidentReport report);

}

public class AccidentRepository : IAccidentRepository
{
    private readonly EVRentalDbContext _context;

    public AccidentRepository(EVRentalDbContext context)
    {
        _context = context;
    }

    public IQueryable<AccidentReport> GetAll()
    {
        return _context.AccidentReports
            .Include(a => a.Vehicle)
                .ThenInclude(v => v.Station)
            .Include(a => a.Contract);
    }

    public void CreateAcc(AccidentReport report)
    {
        _context.AccidentReports.Add(report);
        _context.SaveChanges();
    }

    public void UpdateAcc(AccidentReport report)
    {
        _context.AccidentReports.Update(report);
        _context.SaveChanges();
    }

    public void DeleteAcc(AccidentReport report)
    {
        _context.AccidentReports.Remove(report);
        _context.SaveChanges();
    }
}
