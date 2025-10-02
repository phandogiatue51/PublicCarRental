using PublicCarRental.Models;

namespace PublicCarRental.Repository.Token
{
    public interface ITokenRepository
    {
        string GenerateToken(Account account, TokenPurpose purpose);
        bool VerifyEmail(string token);
        Account? GetAccountByResetToken(string token);
        bool IsPasswordResetTokenValid(string token);
        void InvalidatePasswordResetToken(Account account);
    }
}
