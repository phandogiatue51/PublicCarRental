using Microsoft.EntityFrameworkCore;
using PublicCarRental.DTOs;
using PublicCarRental.Models;
using PublicCarRental.Helpers;
using PublicCarRental.Repository.Acc;

namespace PublicCarRental.Service.Acc
{
    public class AccountService : IAccountService
    {
        private readonly IAccountRepository _accountRepo;
        private readonly PasswordHelper _passwordHelper;

        public AccountService(IAccountRepository accountRepo, PasswordHelper passwordHelper)
        {
            _accountRepo = accountRepo;
            _passwordHelper = passwordHelper;
        }

        public Account GetAccountById(int id)
        {
            return _accountRepo.GetById(id);
        }

        public IEnumerable<Account> GetAllAccounts()
        {
            return _accountRepo.GetAll();
        }

        public void UpdateAccount(Account account)
        {
            _accountRepo.Update(account);
        }

        public void DeleteAccount(int id)
        {
            _accountRepo.Delete(id);
        }
        public int CreateAccount(string fullName, string email, string password, string phoneNumber, string identityCardNumber, AccountRole role)
        {
            var hashedPassword = _passwordHelper.HashPassword(password);

            var account = new Account
            {
                FullName = fullName,
                Email = email,
                PasswordHash = hashedPassword,
                Role = role,
                PhoneNumber = phoneNumber,
                IdentityCardNumber = identityCardNumber,
                RegisteredAt = DateTime.UtcNow,
            };

            _accountRepo.Create(account);
            return account.AccountId;
        }
        public (bool Success, string Message, AccountRole Role) Login(string identifier, string password)
        {
            var user = _accountRepo.GetByIdentifier(identifier);

            if (user == null || !_passwordHelper.VerifyPassword(password, user.PasswordHash) || password.Equals(user.PasswordHash))
                return (false, "Invalid credentials", default);

            return (true, "Login successful", user.Role);
        }
    }
}
 