using System.Text;

namespace PublicCarRental.Helpers
{
    public class PasswordHelper
    {
        public bool VerifyPassword(string password, string storedHash)
        {
            using var sha = System.Security.Cryptography.SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = sha.ComputeHash(bytes);
            var inputHash = Convert.ToBase64String(hash);
            return inputHash == storedHash;
        }

        public string HashPassword(string password)
        {
            using (var sha = System.Security.Cryptography.SHA256.Create())
            {
                var bytes = System.Text.Encoding.UTF8.GetBytes(password);
                var hash = sha.ComputeHash(bytes);
                return Convert.ToBase64String(hash);
            }
        }
    }
}
