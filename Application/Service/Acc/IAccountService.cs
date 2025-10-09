using PublicCarRental.Application.DTOs.Acc;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.Service.Acc
{
    public interface IAccountService
    {
        public AccountDto GetAccountById(int id);
        public IEnumerable<AccountDto> GetAllAccounts();
        void UpdateAccount(Account account);
        void DeleteAccount(int id);
        public (bool Success, string Message, int? AccountId) CreateAccount(BaseAccountDto dto, AccountRole role);
        public (bool Success, string Message, string Token, AccountRole Role) Login(string identifier, string password);
        public (bool success, string message) ResetPassword(string token, string newPassword);
        public (bool success, string message) ChangePassword(int accountId, ChangePasswordDto dto);
        public bool VerifyEmail(string token);
        Task<(bool success, string message)> SendPasswordResetTokenAsync(string email);
        public Account? GetAccountByIdentifier(string identifier);
        public int? GetRenterId(int accountId);
        public int? GetStaffId(int accountId);
        public int? GetStaffStationId(int accountId);
    }
}
