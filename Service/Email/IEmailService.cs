namespace PublicCarRental.Service.Email
{
    public interface IEmailService
    {
        public void SendVerificationEmail(string toEmail, string token);
        public void SendPasswordResetEmail(string toEmail, string token);
    }
}
