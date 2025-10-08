using PublicCarRental.Application.DTOs;

namespace PublicCarRental.Application.Service.Typ
{
    public interface ITypeService
    {
        public IEnumerable<TypeDto> GetAllTypes();
        public TypeDto GetById(int id);
    }
}
