using AutoMapper;
using PublicCarRental.Application.DTOs.Cont;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.Service.Cont
{
    public class ContractMappingProfile : Profile
    {
        public ContractMappingProfile()
        {
            CreateMap<RentalContract, ContractDto>();
        }
    }
}
