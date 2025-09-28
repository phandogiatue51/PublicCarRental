using PublicCarRental.Models;

namespace PublicCarRental.Repository.Typ
{
    public class TypeRepository : ITypeRepository
    {
        private readonly EVRentalDbContext _context;

        public TypeRepository(EVRentalDbContext context)
        {
            _context = context;
        }

        public IEnumerable<VehicleType> GetAll()
        {
            return _context.VehicleTypes.ToList();
        }
        public VehicleType GetById(int id)
        {
            return _context.VehicleTypes.FirstOrDefault(t => t.TypeId == id);
        }
    }
}
