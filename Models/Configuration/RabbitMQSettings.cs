namespace PublicCarRental.Models.Configuration
{    public class RabbitMQSettings
    {
        public string ConnectionString { get; set; }
        public QueueNames QueueNames { get; set; }
    }

    public class QueueNames
    {
        public string EmailQueue { get; set; }
        public string PdfQueue { get; set; }
        public string NotificationQueue { get; set; }
    }
}
