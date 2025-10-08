using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Infrastructure.Data.Repository.Cont
{
    public interface IContractRepository
    {
        void Create(RentalContract contract);
        public IQueryable<RentalContract> GetAll();
        RentalContract GetById(int id);
        void Update(RentalContract contract);
        void Delete(int id);
    }
}
