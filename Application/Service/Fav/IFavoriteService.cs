using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.Service.Fav
{
    public interface IFavoriteService
    {
        public List<VehicleModel> GetFavorite(int accountId);
        public bool AddFavorites(int accountId, int modelId);
        public bool RemoveFavorites(int accountId, int modelId);
    }
}
