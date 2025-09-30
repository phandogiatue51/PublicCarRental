using PublicCarRental.Models;

namespace PublicCarRental.Repository.Fav
{
    public interface IFavoriteRepository
    {
        public IQueryable<Favorite> GetFavoritesByAccountId(int accountId);
        public Favorite? GetFavorite(int accountId, int modelId);
        public void AddFavorite(Favorite favorite);
        public void RemoveFavorite(Favorite favorite);

    }
}
