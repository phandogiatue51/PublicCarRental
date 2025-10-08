using Microsoft.EntityFrameworkCore;
using PublicCarRental.Application.DTOs;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Infrastructure.Data.Repository.Admin
{
    public class AdminRepository
    {
        private readonly EVRentalDbContext _context;
        public AdminRepository(EVRentalDbContext context)
        {
            _context = context;
        }
        public List<FavoriteStatsDto> GetMostFavorited(int topN = 10)
        {
            return _context.Favorites
                .GroupBy(f => f.ModelId)
                .Select(g => new
                {
                    ModelId = g.Key,
                    Count = g.Count()
                })
                .OrderByDescending(x => x.Count)
                .Take(topN)
                .Join(_context.VehicleModels,
                      fav => fav.ModelId,
                      model => model.ModelId,
                      (fav, model) => new FavoriteStatsDto
                      {
                          Model = model,
                          Count = fav.Count
                      })
                .ToList();
        }
    }
}
