using PublicCarRental.Application.DTOs.Pay;
using System.Text;
using System.Text.Json;
using static PublicCarRental.Application.DTOs.Pay.PayOSDto;
namespace PublicCarRental.Application.Service.Pay;

public class PayOSPayoutService : IPayOSPayoutService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<PayOSPayoutService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IRefundService _refundService;

    private readonly string _payoutClientId;
    private readonly string _payoutApiKey;
    private readonly string _baseUrl = "https://api-merchant.payos.vn";

    public PayOSPayoutService(IConfiguration configuration, IHttpClientFactory httpClientFactory, ILogger<PayOSPayoutService> logger,
        IRefundService refundService)
    {
        _httpClient = httpClientFactory.CreateClient();
        _logger = logger;
        _configuration = configuration;

        _payoutClientId = configuration["PayOS:PayoutClientId"];
        _payoutApiKey = configuration["PayOS:PayoutApiKey"];

        _refundService = refundService;

        if (string.IsNullOrEmpty(_payoutClientId) || string.IsNullOrEmpty(_payoutApiKey))
        {
            throw new InvalidOperationException("PayOS payout credentials are not configured");
        }
    }

    public async Task<PayoutResult> CreateSinglePayoutAsync(int refundId, BankAccountInfo bankInfo, decimal refundAmount)
    {
        try
        {

            var payoutRequest = new
            {
                referenceId = $"refund_{refundId}_{DateTime.UtcNow:yyyyMMddHHmmss}",
                amount = refundAmount,
                description = $"Refund for rental #{refundId}",
                toBin = GetBankBin(bankInfo.BankCode),
                toAccountNumber = bankInfo.AccountNumber,
                category = new[] { "refund" }
            };

            _logger.LogInformation($"🔍 Calling PayOS Payout: {_baseUrl}/v1/payouts");
            _logger.LogInformation($"📦 Request: {JsonSerializer.Serialize(payoutRequest)}");

            var response = await SendPayOSRequestAsync(
                "/v1/payouts",
                payoutRequest,
                idempotencyKey: payoutRequest.referenceId
            );

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"✅ PayOS Payout Response: {content}");

                var payoutResponse = JsonSerializer.Deserialize<PayOSPayoutResponse>(content, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                if (payoutResponse?.Data != null)
                {
                    return new PayoutResult
                    {
                        Success = true,
                        TransactionId = payoutResponse.Data.Id,
                        Status = payoutResponse.Data.ApprovalState,
                        Message = "Payout initiated successfully"
                    };
                }
                else
                {
                    _logger.LogError($"❌ PayOS response data is null: {content}");
                    return new PayoutResult
                    {
                        Success = false,
                        Message = "PayOS response data is null"
                    };
                }
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError($"❌ PayOS payout failed: {response.StatusCode} - {errorContent}");

                return new PayoutResult
                {
                    Success = false,
                    Message = $"PayOS API error: {response.StatusCode} - {errorContent}"
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"❌ Failed to create payout for refund #{refundId}");
            return new PayoutResult
            {
                Success = false,
                Message = ex.Message
            };
        }
    }

    public async Task<PayoutInfo> GetPayoutStatusAsync(string payoutId)
    {
        try
        {
            var response = await SendPayOSRequestAsync($"/v1/payouts/{payoutId}", null, HttpMethod.Get);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var payoutResponse = JsonSerializer.Deserialize<PayOSPayoutDetailResponse>(content, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                var latestTransaction = payoutResponse.Data.Transactions?.LastOrDefault();
                var transactionStatus = latestTransaction?.State ?? "PENDING";

                return new PayoutInfo
                {
                    TransactionId = payoutResponse.Data.Id,
                    Status = transactionStatus, 
                    Amount = latestTransaction?.Amount ?? payoutResponse.Data.Transactions?.FirstOrDefault()?.Amount ?? 0,
                    CreatedAt = payoutResponse.Data.CreatedAt,
                    CompletedAt = latestTransaction?.TransactionDatetime
                };
            }
            else
            {
                throw new HttpRequestException($"Failed to get payout status: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"❌ Failed to get payout status for {payoutId}");
            throw;
        }
    }

    public async Task<decimal> GetAccountBalanceAsync()
    {
        try
        {
            var response = await SendPayOSRequestAsync("/v1/payouts-account/balance", null, HttpMethod.Get);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var balanceResponse = JsonSerializer.Deserialize<PayOSBalanceResponse>(content, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                return decimal.Parse(balanceResponse.Data.Balance); 
            }
            else
            {
                throw new HttpRequestException($"Failed to get account balance: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to get account balance");
            throw;
        }
    }

    public async Task<decimal> EstimateCreditAsync(decimal amount)
    {
        try
        {
            var estimateRequest = new
            {
                referenceId = $"estimate_{DateTime.UtcNow:yyyyMMddHHmmss}",
                category = new[] { "refund" },
                validateDestination = true,
                payouts = new[]
                {
                    new
                    {
                        referenceId = $"payout_estimate_{DateTime.UtcNow:yyyyMMddHHmmss}",
                        amount = (int)amount,
                        description = "Refund estimate",
                        toBin = "970436",
                        toAccountNumber = "000000000"
                    }
                }
            };

            var response = await SendPayOSRequestAsync("/v1/payouts/estimate-credit", estimateRequest);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"✅ Estimate Credit Response: {content}");

                return amount;
            }
            else
            {
                throw new HttpRequestException($"Failed to estimate credit: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"❌ Failed to estimate credit for amount {amount}");
            throw;
        }
    }

    private string GetBankBin(string bankCode)
    {
        var bankBins = new Dictionary<string, string>
        {
            { "VCB", "970436" }, { "BIDV", "970418" }, { "VIB", "970441" },
            { "MB", "970422" }, { "TCB", "970407" }, { "ACB", "970416" },
            { "VPB", "970432" }, { "TPB", "970423" }, { "HDB", "970437" },
            { "MSB", "970426" }, { "SCB", "970429" }, { "OCB", "970448" },
            { "SHB", "970443" }, { "EIB", "970431" }, { "VAB", "970425" },
            { "NAB", "970428" }, { "BAB", "970409" }, { "PGB", "970430" },
            { "GPB", "970408" }, { "AGB", "970405" }, { "LVB", "970434" },
            { "KLB", "970452" }, { "VBSP", "970427" }
        };

        return bankBins.GetValueOrDefault(bankCode.ToUpper(), "970436");
    }

    private async Task<HttpResponseMessage> SendPayOSRequestAsync(string endpoint, object data = null, HttpMethod method = null, string idempotencyKey = null)
    {
        method ??= data == null ? HttpMethod.Get : HttpMethod.Post;
        var url = $"{_baseUrl}{endpoint}";

        using var request = new HttpRequestMessage(method, url);

        request.Headers.Add("x-client-id", _payoutClientId);
        request.Headers.Add("x-api-key", _payoutApiKey);

        if (!string.IsNullOrEmpty(idempotencyKey))
        {
            request.Headers.Add("Idempotency-Key", idempotencyKey);
        }

        if (data != null)
        {
            var json = JsonSerializer.Serialize(data, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        }

        return await _httpClient.SendAsync(request);
    }
}