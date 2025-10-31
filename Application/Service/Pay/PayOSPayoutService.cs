using PublicCarRental.Application.DTOs.Pay;
using System.Text;
using System.Text.Json;
using static PublicCarRental.Application.DTOs.Pay.PayOSDto;
namespace PublicCarRental.Application.Service.Pay;

public class PayOSPayoutService : IPayOSPayoutService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<PayOSPayoutService> _logger;

    private readonly string _payoutClientId;
    private readonly string _payoutApiKey;
    private readonly string _payoutCheckSumKey;
    private readonly string _baseUrl = "https://api-merchant.payos.vn";

    public PayOSPayoutService(IConfiguration configuration, IHttpClientFactory httpClientFactory, ILogger<PayOSPayoutService> logger)
    {
        _httpClient = httpClientFactory.CreateClient();
        _logger = logger;

        _payoutClientId = configuration["PayOS:PayoutClientId"];
        _payoutApiKey = configuration["PayOS:PayoutApiKey"];
        _payoutCheckSumKey = configuration["PayOS:PayoutChecksumKey"];

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
                amount = (int)refundAmount,
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
            request.Headers.Add("x-idempotency-key", idempotencyKey);
        }

        var signature = GeneratePayoutSignature(data);
        request.Headers.Add("x-signature", signature);

        if (data != null)
        {
            var json = JsonSerializer.Serialize(data, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        }

        _logger.LogInformation($"📤 Headers: x-idempotency-key: {idempotencyKey}, x-signature: {signature}");

        return await _httpClient.SendAsync(request);
    }

    private string GeneratePayoutSignature(object data)
    {
        if (data == null) return string.Empty;

        var json = JsonSerializer.Serialize(data, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        var dataDict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json);
        var sortedKeys = dataDict.Keys.OrderBy(k => k).ToList();

        var queryString = string.Join("&", sortedKeys.Select(key =>
        {
            var value = dataDict[key];
            var valueStr = value.ValueKind == JsonValueKind.String ? value.GetString() : value.ToString();
            return $"{key}={valueStr}";
        }));

        using var hmac = new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(_payoutCheckSumKey));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(queryString));
        return BitConverter.ToString(hash).Replace("-", "").ToLower();
    }
}