using Microsoft.EntityFrameworkCore;
using PublicCarRental.DTOs;
using PublicCarRental.DTOs.Acc;
using PublicCarRental.Helpers;
using PublicCarRental.Models;
using PublicCarRental.Repository.Acc;
using PublicCarRental.Repository.Token;

namespace PublicCarRental.Service.Acc
{
    public class AccountService : IAccountService
    {
        private readonly IAccountRepository _accountRepo;
        private readonly PasswordHelper _passwordHelper;
        private readonly ITokenRepository _tokenRepository;
        private readonly IEmailService _emailService;
        public AccountService(IAccountRepository accountRepo, PasswordHelper passwordHelper, 
            ITokenRepository tokenRepository, IEmailService emailService)
        {
            _accountRepo = accountRepo;
            _passwordHelper = passwordHelper;
            _tokenRepository = tokenRepository;
            _emailService = emailService;
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

        public (bool Success, string Message, int? AccountId) CreateAccount(string fullName, string email, string password, string phoneNumber, string identityCardNumber, AccountRole role)
        {
            try
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
                    Status = AccountStatus.Active
                };

                _accountRepo.Create(account);
                var token = _tokenRepository.GenerateToken(account, TokenPurpose.EmailVerification);
                _emailService.SendVerificationEmail(account.Email, token);
                return (true, "Account created successfully.", account.AccountId);
            }
            catch (Exception ex)
            {
                return (false, ex.Message, null);
            }
        }

        public (bool Success, string Message, AccountRole Role) Login(string identifier, string password)
        {
            var user = _accountRepo.GetByIdentifier(identifier);

            if (user == null || !_passwordHelper.VerifyPassword(password, user.PasswordHash) || password.Equals(user.PasswordHash))
                return (false, "Invalid credentials", default);

            return (true, "Login successful", user.Role);
        }

        public (bool success, string message) ResetPassword(string token, string newPassword)
        {
            var account = _tokenRepository.GetAccountByResetToken(token);
            if (account == null)
                return (false, "Invalid or expired token.");

            account.PasswordHash = _passwordHelper.HashPassword(newPassword);
            _tokenRepository.InvalidatePasswordResetToken(account);

            return (true, "Password has been reset successfully.");
        }

        public (bool success, string message) ChangePassword(int accountId, ChangePasswordDto dto)
        {
            var account = _accountRepo.GetById(accountId);
            if (account == null)
                return (false, "Account not found.");

            if (!account.IsEmailVerified)
                return (false, "Please verify your email before changing your password.");

            if (!_passwordHelper.VerifyPassword(dto.OldPassword, account.PasswordHash))
                return (false, "Old password is incorrect.");

            if (dto.NewPassword != dto.ConfirmPassword)
                return (false, "New password and confirmation do not match.");

            if (dto.NewPassword == dto.OldPassword)
                return (false, "New password must be different from the old password.");

            account.PasswordHash = _passwordHelper.HashPassword(dto.NewPassword);
            _accountRepo.Update(account);

            return (true, "Password changed successfully.");
        }

        public (bool success, string message) SendToken(string email)
        {
            var account = _accountRepo.GetByIdentifier(email);
            if (account == null)
            {
                return (false, "No account found with that email.");
            }

            if (account.IsEmailVerified)
            {
                return (false, "This account has already verified its email.");
            }

            var token = _tokenRepository.GenerateToken(account, TokenPurpose.EmailVerification);
            _emailService.SendVerificationEmail(account.Email, token);

            return (true, "Verification email has been sent.");
        }
        public bool ValidatePasswordResetToken(string token)
        {
            return _tokenRepository.IsPasswordResetTokenValid(token);
        }

        public bool VerifyEmail(string token)
        {
            return _tokenRepository.VerifyEmail(token);
        }

        public (bool success, string message) SendPasswordResetToken(string email)
        {
            var account = _accountRepo.GetByIdentifier(email);
            if (account == null)
                return (false, "Email not found.");

            var token = _tokenRepository.GenerateToken(account, TokenPurpose.PasswordReset);
            _emailService.SendPasswordResetEmail(email, token);

            return (true, "Password reset token sent.");
        }
    }
}
 