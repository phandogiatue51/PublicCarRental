using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Fav;

namespace PublicCarRental.Application.Service.Fav
{
    public class FavoriteService : IFavoriteService
    {
        private readonly IFavoriteRepository _favoriteRepo;
        public FavoriteService(IFavoriteRepository favoriteRepository)
        {
            _favoriteRepo = favoriteRepository;
        }
        public List<VehicleModel> GetFavorite(int accountId)
        {
            var favorites = _favoriteRepo.GetFavoritesByAccountId(accountId);
            return favorites.Select(f => f.VehicleModel).ToList();
        }

        public bool AddFavorites(int accountId, int modelId)
        {
            var existing = _favoriteRepo.GetFavorite(accountId, modelId);
            if (existing != null) return false;

            var favorite = new Favorite
            {
                AccountId = accountId,
                ModelId = modelId,
                FavoritedAt = DateTime.UtcNow
            };

            _favoriteRepo.AddFavorite(favorite);
            return true;
        }

        public bool RemoveFavorites(int accountId, int modelId)
        {
            var favorite = _favoriteRepo.GetFavorite(accountId, modelId);
            if (favorite == null) return false;

            _favoriteRepo.RemoveFavorite(favorite);
            return true;
        }
    }
}
