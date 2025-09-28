using PublicCarRental.DTOs;
using PublicCarRental.Models;

namespace PublicCarRental.Service.Typ
{
    public interface ITypeService
    {
        public IEnumerable<TypeDto> GetAllTypes();
        public TypeDto GetById(int id);
    }
}
