using PublicCarRental.DTOs.Acc;
using PublicCarRental.Models;

namespace PublicCarRental.Service.Acc
{
    public interface IAccountService
    {
        Account GetAccountById(int id);
        IEnumerable<Account> GetAllAccounts();
        void UpdateAccount(Account account);
        void DeleteAccount(int id);
        public (bool Success, string Message, int? AccountId) CreateAccount(AccountDto dto, AccountRole role);
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
