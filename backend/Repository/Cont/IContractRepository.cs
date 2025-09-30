using PublicCarRental.Models;

namespace PublicCarRental.Repository.Cont
{
    public interface IContractRepository
    {
        void Create(RentalContract contract);
        public IQueryable<RentalContract> GetAll();
        RentalContract GetById(int id);
        void Update(RentalContract contract);
    }
}
