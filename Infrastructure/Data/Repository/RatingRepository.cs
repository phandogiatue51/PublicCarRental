using Microsoft.EntityFrameworkCore;
using PublicCarRental.Infrastructure.Data.Models;

public interface IRatingRepository
{
    Rating GetById(int ratingId);
    IQueryable<Rating> GetAll();
    void Add(Rating rating);
    void Update(Rating rating);
    void Delete(Rating rating);

    IQueryable<Rating> GetRatingsByContractId(int contractId);
    IQueryable<Rating> GetRatingsByRenterId(int renterId);
    IQueryable<Rating> GetRatingsByModelId(int modelId);
    IQueryable<Rating> GetRatingsByVehicleId(int vehicleId);

    double? GetAverageRatingByModelId(int modelId);
    double? GetAverageRatingByRenterId(int renterId);
    int GetRatingCountByModelId(int modelId);
    int GetRatingCountByRenterId(int renterId);

    IQueryable<Rating> GetRecentRatings(int count = 10);
    IQueryable<Rating> GetRatingsByStar(RatingLabel starRating);
}

public class RatingRepository : IRatingRepository
{
    private readonly EVRentalDbContext _context;

    public RatingRepository(EVRentalDbContext context)
    {
        _context = context;
    }

    public Rating GetById(int ratingId)
    {
        return _context.Ratings
            .Include(r => r.Contract)
                .ThenInclude(c => c.EVRenter)
                    .ThenInclude(r => r.Account)
            .Include(r => r.Contract)
                .ThenInclude(c => c.Vehicle)
                    .ThenInclude(v => v.Model)
            .FirstOrDefault(r => r.RatingId == ratingId);
    }

    public IQueryable<Rating> GetAll()
    {
        return _context.Ratings
            .Include(r => r.Contract)
                .ThenInclude(c => c.EVRenter)
                    .ThenInclude(r => r.Account)
            .Include(r => r.Contract)
                .ThenInclude(c => c.Vehicle)
                    .ThenInclude(v => v.Model)
            .OrderByDescending(r => r.CreatedAt);
    }

    public void Add(Rating rating)
    {
        _context.Ratings.Add(rating);
        _context.SaveChanges();
    }

    public void Update(Rating rating)
    {
        _context.Ratings.Update(rating);
        _context.SaveChanges();
    }

    public void Delete(Rating rating)
    {
        _context.Ratings.Remove(rating);
        _context.SaveChanges();
    }

    public IQueryable<Rating> GetRatingsByContractId(int contractId)
    {
        return _context.Ratings
            .Include(r => r.Contract)
                .ThenInclude(c => c.Vehicle)
                    .ThenInclude(v => v.Model)
            .Where(r => r.ContractId == contractId)
            .OrderByDescending(r => r.CreatedAt);
    }

    public IQueryable<Rating> GetRatingsByRenterId(int renterId)
    {
        return _context.Ratings
            .Include(r => r.Contract)
                .ThenInclude(c => c.Vehicle)
                    .ThenInclude(v => v.Model)
            .Where(r => r.Contract.EVRenterId == renterId)
            .OrderByDescending(r => r.CreatedAt);
    }

    public IQueryable<Rating> GetRatingsByModelId(int modelId)
    {
        return _context.Ratings
            .Include(r => r.Contract)
                .ThenInclude(c => c.Vehicle)
            .Include(r => r.Contract)
                .ThenInclude(c => c.EVRenter)
                    .ThenInclude(r => r.Account)
            .Where(r => r.Contract.Vehicle.Model.ModelId == modelId)
            .OrderByDescending(r => r.CreatedAt);
    }

    public IQueryable<Rating> GetRatingsByVehicleId(int vehicleId)
    {
        return _context.Ratings
            .Include(r => r.Contract)
                .ThenInclude(c => c.EVRenter)
                    .ThenInclude(r => r.Account)
            .Where(r => r.Contract.VehicleId == vehicleId)
            .OrderByDescending(r => r.CreatedAt);
    }

    public double? GetAverageRatingByModelId(int modelId)
    {
        return _context.Ratings
            .Where(r => r.Contract.Vehicle.Model.ModelId == modelId)
            .Average(r => (double?)r.Stars);
    }

    public double? GetAverageRatingByRenterId(int renterId)
    {
        return _context.Ratings
            .Where(r => r.Contract.EVRenterId == renterId)
            .Average(r => (double?)r.Stars);
    }

    public int GetRatingCountByModelId(int modelId)
    {
        return _context.Ratings
            .Count(r => r.Contract.Vehicle.Model.ModelId == modelId);
    }

    public int GetRatingCountByRenterId(int renterId)
    {
        return _context.Ratings
            .Count(r => r.Contract.EVRenterId == renterId);
    }

    public IQueryable<Rating> GetRecentRatings(int count = 10)
    {
        return _context.Ratings
            .Include(r => r.Contract)
                .ThenInclude(c => c.Vehicle)
                    .ThenInclude(v => v.Model)
            .Include(r => r.Contract)
                .ThenInclude(c => c.EVRenter)
                    .ThenInclude(r => r.Account)
            .OrderByDescending(r => r.CreatedAt)
            .Take(count);
    }

    public IQueryable<Rating> GetRatingsByStar(RatingLabel starRating)
    {
        return _context.Ratings
            .Include(r => r.Contract)
                .ThenInclude(c => c.Vehicle)
                    .ThenInclude(v => v.Model)
            .Include(r => r.Contract)
                .ThenInclude(c => c.EVRenter)
                    .ThenInclude(r => r.Account)
            .Where(r => r.Stars == starRating)
            .OrderByDescending(r => r.CreatedAt);
    }
}