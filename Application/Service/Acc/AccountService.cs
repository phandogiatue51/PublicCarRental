using Microsoft.IdentityModel.Tokens;
using PublicCarRental.Application.DTOs.Acc;
using PublicCarRental.Application.Service.Email;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Acc;
using PublicCarRental.Infrastructure.Data.Repository.Token;
using PublicCarRental.Infrastructure.Helpers;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace PublicCarRental.Application.Service.Acc
{
    public class AccountService : IAccountService
    {
        private readonly IAccountRepository _accountRepo;
        private readonly PasswordHelper _passwordHelper;
        private readonly ITokenRepository _tokenRepository;
        private readonly IConfiguration _configuration;
        private readonly EmailProducerService _emailProducer;

        public AccountService(IAccountRepository accountRepo, PasswordHelper passwordHelper,
            ITokenRepository tokenRepository, IConfiguration configuration
            , EmailProducerService emailProducer)
        {
            _accountRepo = accountRepo;
            _passwordHelper = passwordHelper;
            _tokenRepository = tokenRepository;
            _configuration = configuration;
            _emailProducer = emailProducer;
        }

        public AccountDto GetAccountById(int id)
        {
            var account = _accountRepo.GetById(id);
            return new AccountDto
            {
                Id = account.AccountId,
                FullName = account.FullName,
                PhoneNumber = account.PhoneNumber,
                Email = account.Email,
                IdentityCardNumber = account.IdentityCardNumber,
                Role = account.Role,
            };
        }

        public IEnumerable<AccountDto> GetAllAccounts()
        {
            return _accountRepo.GetAll()
                 .Select(m => new AccountDto
                 {
                     Id = m.AccountId,
                     FullName = m.FullName,
                     Email = m.Email,
                     PhoneNumber = m.PhoneNumber,
                     IdentityCardNumber = m.IdentityCardNumber,
                     Role = m.Role,
                 }).ToList();
        }

        public void UpdateAccount(Account account)
        {
            _accountRepo.Update(account);
        }

        public void DeleteAccount(int id)
        {
            _accountRepo.Delete(id);
        }

        public (bool Success, string Message, int? AccountId) CreateAccount(BaseAccountDto dto, AccountRole role)
        {
            try
            {
                if (_accountRepo.Exists(a => a.Email == dto.Email))
                    return (false, "Email is already registered.", null);

                if (_accountRepo.Exists(a => a.PhoneNumber == dto.PhoneNumber))
                    return (false, "Phone number is already registered.", null);

                if (_accountRepo.Exists(a => a.IdentityCardNumber == dto.IdentityCardNumber))
                    return (false, "Identity card is already registered.", null);

                var hashedPassword = _passwordHelper.HashPassword(dto.Password);

                var account = new Account
                {
                    FullName = dto.FullName,
                    Email = dto.Email,
                    PasswordHash = hashedPassword,
                    Role = role,
                    PhoneNumber = dto.PhoneNumber,
                    RegisteredAt = DateTime.UtcNow,
                    IdentityCardNumber = dto.IdentityCardNumber,
                    Status = AccountStatus.Active
                };

                _accountRepo.Create(account);

                return (true, "Account created successfully.", account.AccountId);
            }
            catch (Exception ex)
            {
                return (false, "An error occurred while creating the account.", null);
            }
        }

        public (bool Success, string Message, string Token, AccountRole Role) Login(string identifier, string password)
        {
            var user = _accountRepo.GetByIdentifier(identifier);

            if (user == null)
                return (false, "Account does not exist!", null, default);

            if (user.Status == AccountStatus.Inactive)
                return (false, "Account is inactive. Please contact support.", null, default);

            if (user.Status == AccountStatus.Suspended)
                return (false, "Account is suspended. Please contact support.", null, default);

            if (!_passwordHelper.VerifyPassword(password, user.PasswordHash))
                return (false, "Wrong email/phone or password", null, default);

            var claims = GenerateUserClaims(user);

            var key = Convert.FromBase64String(_configuration["Jwt:Key"]);
            var securityKey = new SymmetricSecurityKey(key);

            var creds = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
            string welcomeMessage = GetWelcomeMessage(user);

            return (true, welcomeMessage, tokenString, user.Role);
        }

        private List<Claim> GenerateUserClaims(Account user)
        {
            var claims = new List<Claim>
            {
                new Claim("AccountId", user.AccountId.ToString()),
                new Claim("Email", user.Email),
                new Claim("Role", user.Role.ToString()),
                // Keep the standard claims for compatibility
                new Claim(ClaimTypes.NameIdentifier, user.AccountId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
            };

            switch (user.Role)
            {
                case AccountRole.EVRenter:
                    var renterId = _accountRepo.GetRenterId(user.AccountId);
                    if (renterId.HasValue)
                    {
                        claims.Add(new Claim("RenterId", renterId.Value.ToString()));
                        claims.Add(new Claim("UserTypeId", renterId.Value.ToString()));
                    }
                    break;

                case AccountRole.Staff:
                    var staffId = _accountRepo.GetStaffId(user.AccountId);
                    if (staffId.HasValue)
                    {
                        claims.Add(new Claim("StaffId", staffId.Value.ToString()));
                        claims.Add(new Claim("UserTypeId", staffId.Value.ToString()));

                        var stationId = _accountRepo.GetStaffStationId(user.AccountId);
                        if (stationId.HasValue)
                        {
                            claims.Add(new Claim("StationId", stationId.Value.ToString()));
                        }
                    }
                    break;

                case AccountRole.Admin:
                    claims.Add(new Claim("UserTypeId", user.AccountId.ToString()));
                    claims.Add(new Claim("IsAdmin", "true"));
                    break;
            }

            return claims;
        }

        private string GetWelcomeMessage(Account user)
        {
            return user.Role switch
            {
                AccountRole.Admin => "Welcome Admin",
                AccountRole.Staff => $"Welcome, Staff {user.FullName}",
                AccountRole.EVRenter => $"Welcome, Renter {user.FullName}",
                _ => "Login successful"
            };
        }

        public (bool success, string message) ResetPassword(string token, string newPassword)
        {
            var account = _tokenRepository.GetAccountByResetToken(token);
            if (account == null)
                return (false, "Invalid or expired token.");

            account.PasswordHash = _passwordHelper.HashPassword(newPassword);
            _tokenRepository.InvalidatePasswordResetToken(account);

            account.PasswordResetToken = null;
            account.PasswordResetRequestedAt = null;
            _accountRepo.Update(account);
                
            return (true, "Password has been reset successfully.");
        }

        public (bool success, string message) ChangePassword(int accountId, ChangePasswordDto dto)
        {
            var account = _accountRepo.GetById(accountId);
            if (account == null)
                return (false, "Account not found.");

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

        public async Task<(bool success, string message)> SendTokenAsync(string email)
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
            await _emailProducer.QueueVerificationEmailAsync(account.Email, token);

            return (true, "Verification email has been sent.");
        }

        public bool VerifyEmail(string token)
        {
            return _tokenRepository.VerifyEmail(token);
        }

        public async Task<(bool success, string message)> SendPasswordResetTokenAsync(string email)
        {
            var account = _accountRepo.GetByIdentifier(email);
            if (account == null)
                return (false, "Email not found.");

            var token = _tokenRepository.GenerateToken(account, TokenPurpose.PasswordReset);
            await _emailProducer.QueuePasswordResetEmailAsync(email, token);

            return (true, "Password reset token sent.");
        }

        public Account? GetAccountByIdentifier(string identifier)
        {
            var account = _accountRepo.GetByIdentifier(identifier);
            Console.WriteLine($"GetAccountByIdentifier called for identifier: {identifier}, returned AccountId: {account?.AccountId}");
            return account;
        }

        public int? GetRenterId(int accountId)
        {
            var renterId = _accountRepo.GetRenterId(accountId);
            Console.WriteLine($"GetRenterId called for AccountId: {accountId}, returned: {renterId}");
            return renterId;
        }

        public int? GetStaffId(int accountId)
        {
            return _accountRepo.GetStaffId(accountId);
        }

        public int? GetStaffStationId(int accountId)
        {
            return _accountRepo.GetStaffStationId(accountId);
        }
    }
}
 