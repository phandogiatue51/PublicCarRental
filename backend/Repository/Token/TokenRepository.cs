using Microsoft.EntityFrameworkCore;
using PublicCarRental.Models;

namespace PublicCarRental.Repository.Token
{
    public class TokenRepository : ITokenRepository
    {
        private readonly EVRentalDbContext _context;

        public TokenRepository(EVRentalDbContext context)
        {
            _context = context;
        }

        public string GenerateToken(Account account, TokenPurpose purpose)
        {
            var token = Guid.NewGuid().ToString();

            switch (purpose)
            {
                case TokenPurpose.EmailVerification:
                    account.EmailVerificationToken = token;
                    break;

                case TokenPurpose.PasswordReset:
                    account.PasswordResetToken = token;
                    account.PasswordResetRequestedAt = DateTime.UtcNow;
                    break;

                default:
                    throw new ArgumentException("Unsupported token purpose.");
            }

            _context.SaveChanges();
            return token;
        }

        public bool VerifyEmail(string token)
        {
            var account = _context.Accounts.FirstOrDefault(a => a.EmailVerificationToken == token);
            if (account == null) return false;

            account.IsEmailVerified = true;
            account.EmailVerificationToken = null;
            _context.SaveChanges();
            return true;
        }

        public Account? GetAccountByResetToken(string token)
        {
            return _context.Accounts.FirstOrDefault(a => a.PasswordResetToken == token);
        }

        public bool IsPasswordResetTokenValid(string token)
        {
            var account = GetAccountByResetToken(token);
            if (account == null || account.PasswordResetRequestedAt == null)
                return false;

            return account.PasswordResetRequestedAt >= DateTime.UtcNow.AddMinutes(-30);
        }

        public void InvalidatePasswordResetToken(Account account)
        {
            account.PasswordResetToken = null;
            account.PasswordResetRequestedAt = null;
            _context.SaveChanges();
        }
    }
}