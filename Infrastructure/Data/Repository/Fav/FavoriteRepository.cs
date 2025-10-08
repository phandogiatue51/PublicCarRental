using Microsoft.EntityFrameworkCore;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Infrastructure.Data.Repository.Fav
{
    public class FavoriteRepository : IFavoriteRepository
    {
        private readonly EVRentalDbContext _context;

        public FavoriteRepository(EVRentalDbContext context)
        {
            _context = context;
        }

        public IQueryable<Favorite> GetFavoritesByAccountId(int accountId)
        {
            return _context.Favorites
                .Include(f => f.VehicleModel)
                .Where(f => f.AccountId == accountId);
        }

        public Favorite? GetFavorite(int accountId, int modelId)
        {
            return _context.Favorites
                .FirstOrDefault(f => f.AccountId == accountId && f.ModelId == modelId);
        }

        public void AddFavorite(Favorite favorite)
        {
            _context.Favorites.Add(favorite);
            _context.SaveChanges();
        }

        public void RemoveFavorite(Favorite favorite)
        {
            _context.Favorites.Remove(favorite);
            _context.SaveChanges();
        }
    }
}
