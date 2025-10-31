namespace PublicCarRental.Application.DTOs.Pay
{
    public class PayOSDto
    {
        public class PayOSPayoutResponse
        {
            public string Code { get; set; }
            public string Desc { get; set; }
            public PayoutData Data { get; set; }
        }

        public class PayOSPayoutDetailResponse
        {
            public string Code { get; set; }
            public string Desc { get; set; }
            public PayoutDetailData Data { get; set; }
        }

        public class PayOSBalanceResponse
        {
            public string Code { get; set; }
            public string Desc { get; set; }
            public BalanceData Data { get; set; }
        }

        public class PayoutData
        {
            public string Id { get; set; }
            public string ReferenceId { get; set; }
            public string ApprovalState { get; set; }
            public DateTime CreatedAt { get; set; }
        }

        public class PayoutDetailData : PayoutData
        {
            public List<PayoutTransaction> Transactions { get; set; }
            public List<string> Category { get; set; }
        }

        public class PayoutTransaction
        {
            public string Id { get; set; }
            public string ReferenceId { get; set; }
            public int Amount { get; set; }
            public string Description { get; set; }
            public string ToBin { get; set; }
            public string ToAccountNumber { get; set; }
            public string ToAccountName { get; set; }
            public string Reference { get; set; }
            public DateTime TransactionDatetime { get; set; }
            public string ErrorMessage { get; set; }
            public string ErrorCode { get; set; }
            public string State { get; set; } 
        }

        public class BalanceData
        {
            public string AccountNumber { get; set; }
            public string AccountName { get; set; }
            public string Currency { get; set; }
            public string Balance { get; set; } 
        }
    }
}
