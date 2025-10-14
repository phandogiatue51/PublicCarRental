using PublicCarRental.Application.DTOs.Mod;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Acc;
using PublicCarRental.Infrastructure.Data.Repository.Fav;
using PublicCarRental.Infrastructure.Data.Repository.Ren;

namespace PublicCarRental.Application.Service
{
    public class FavoriteService : IFavoriteService
    {
        private readonly IFavoriteRepository _favoriteRepo;
        private readonly IEVRenterRepository _eVRenterRepository;

        public FavoriteService(IFavoriteRepository favoriteRepository, IEVRenterRepository eVRenterRepository)
        {
            _favoriteRepo = favoriteRepository;
            _eVRenterRepository = eVRenterRepository;
        }

        public async Task<List<ModelViewDto>> GetFavoriteAsync(int renterId)
        {
            try
            {
                var renter = await _eVRenterRepository.GetByIdAsync(renterId);
                if (renter == null || renter.AccountId == 0)
                    return null;
                var accountId = renter.AccountId;

                return _favoriteRepo.GetFavoritesByAccountId(accountId)
                    .Select(favorite => new ModelViewDto
                    {
                        Name = favorite.VehicleModel.Name,
                        BrandName = favorite.VehicleModel.Brand.Name,
                        TypeName = favorite.VehicleModel.Type.Name,
                        PricePerHour = favorite.VehicleModel.PricePerHour,
                        ImageUrl = favorite.VehicleModel.ImageUrl
                    }).ToList();
            }
            catch (Exception ex)
            {
                throw new ApplicationException("Error retrieving favorites", ex);
            }
        }

        public async Task<bool> AddFavoritesAsync(int renterId, int modelId)
        {
            try
            {
                var renter = await _eVRenterRepository.GetByIdAsync(renterId);
                if (renter == null || renter.AccountId == 0)
                    return false;
                var accountId = renter.AccountId;

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
            catch (Exception ex)
            {
                throw new ApplicationException("Error adding favorite", ex);
            }
        }

        public async Task<bool> RemoveFavoritesAsync(int renterId, int modelId)
        {
            try
            {
                var renter = await _eVRenterRepository.GetByIdAsync(renterId);
                if (renter == null || renter.AccountId == 0)
                    return false;
                var accountId = renter.AccountId;

                var favorite = _favoriteRepo.GetFavorite(accountId, modelId);
                if (favorite == null) return false;

                _favoriteRepo.RemoveFavorite(favorite);
                return true;
            }
            catch (Exception ex)
            {
                throw new ApplicationException("Error removing favorite", ex);
            }
        }
    }

    public interface IFavoriteService
    {
        Task<List<ModelViewDto>> GetFavoriteAsync(int renterId);
        Task<bool> AddFavoritesAsync(int renterId, int modelId);
        Task<bool> RemoveFavoritesAsync(int renterId, int modelId);
    }
}
