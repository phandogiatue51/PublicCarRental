using PublicCarRental.Application.DTOs;

namespace PublicCarRental.Application.Service.Typ
{
    public interface ITypeService
    {
        Task<IEnumerable<TypeDto>> GetAllTypesAsync();
        Task<TypeDto> GetByIdAsync(int id);
    }
}
