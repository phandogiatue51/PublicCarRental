﻿using PublicCarRental.DTOs.Staf;
using PublicCarRental.Models;

namespace PublicCarRental.Service.Staf
{
    public interface IStaffService
    {
        public IEnumerable<StaffReadDto> GetAllStaff();

        public Staff? GetEntityById(int id);
        public StaffReadDto? GetById(int id);
        public void CreateStaff(int accountId, StaffDto dto);
        public bool UpdateStaff(int id, StaffDto updatedStaff);
        public bool DeleteStaff(int id);
    }
}
