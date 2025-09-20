using PublicCarRental.Models;

namespace PublicCarRental.Service.Acc
{
    public interface IAccountService
    {
        Account GetAccountById(int id);
        IEnumerable<Account> GetAllAccounts();
        void UpdateAccount(Account account);
        void DeleteAccount(int id);
        public int CreateAccount(string fullName, string email, string password, string phoneNumber, string identityCardNumber, AccountRole role);
        public (bool Success, string Message, AccountRole Role) Login(string identifier, string password);
    }
}
