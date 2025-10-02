using PublicCarRental.DTOs;
using PublicCarRental.Models;
using PublicCarRental.Repository.Typ;

namespace PublicCarRental.Service.Typ
{
    public class TypeService : ITypeService
    {
        private readonly ITypeRepository _typeRepo;
        public TypeService(ITypeRepository typeRepo)
        {
            _typeRepo = typeRepo;
        }

        public IEnumerable<TypeDto> GetAllTypes()
        {
            return _typeRepo.GetAll()
            .Select(type => new TypeDto
            {
                TypeId = type.TypeId,
                Name = type.Name
            }).ToList();
        }

        public TypeDto GetById(int id)
        {
            var type = _typeRepo.GetById(id);
            if (type == null) return null;
            return new TypeDto
            {
                TypeId = type.TypeId,
                Name = type.Name
            };
        }
    }
}
