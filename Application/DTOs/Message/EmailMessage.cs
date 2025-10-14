namespace PublicCarRental.Application.DTOs.Message
{
    public class EmailMessage
    {
        public string ToEmail { get; set; }
        public string Subject { get; set; }
        public string Body { get; set; }
        public bool IsHtml { get; set; } = true;
        public string MessageType { get; set; } // "Verification", "PasswordReset"
        public string Token { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<EmailAttachment> Attachments { get; set; } = new List<EmailAttachment>();
    }

    public class EmailAttachment
    {
        public string FileName { get; set; }
        public byte[] Content { get; set; }
        public string ContentType { get; set; }
    }
}
