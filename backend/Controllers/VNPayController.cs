using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Models;
using PublicCarRental.Service.Cont;
using PublicCarRental.Service.Inv;
using PublicCarRental.Service.Trans;
using PublicCarRental.Service.VNPay;

[ApiController]
[Route("api/payment")]
public class VNPayController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;
    private readonly IContractService _contractService;
    private readonly ITransactionService _transactionService;
    private readonly IVNPayService _vnpayService;

    public VNPayController(
        IInvoiceService invoiceService,
        IContractService contractService,
        ITransactionService transactionService,
        IVNPayService vnpayService)
    {
        _invoiceService = invoiceService;
        _contractService = contractService;
        _transactionService = transactionService;
        _vnpayService = vnpayService;
    }

    [HttpPost("create/{invoiceId}")]
    public IActionResult CreatePayment(int invoiceId)
    {
        var invoice = _invoiceService.GetEntityById(invoiceId);
        if (invoice == null) return NotFound("Invoice not found");

        if (invoice.Status == InvoiceStatus.Paid)
            return BadRequest("Invoice already paid");

        // Generate VNPay payment URL
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var paymentUrl = _vnpayService.CreatePaymentUrl(invoice, ipAddress);

        return Ok(new { payment_url = paymentUrl });
    }

    [HttpGet("vnpay-return")]
    public IActionResult VNPayReturn([FromQuery] VNPayReturnModel model)
    {
        // Verify VNPay response
        var isValid = _vnpayService.VerifyPayment(model);

        if (isValid && model.vnp_ResponseCode == "00")
        {
            // Payment successful
            var invoiceId = int.Parse(model.vnp_TxnRef);
            var invoice = _invoiceService.GetEntityById(invoiceId);

            if (invoice != null && invoice.Status != InvoiceStatus.Paid)
            {
                // Update invoice
                invoice.Status = InvoiceStatus.Paid;
                invoice.PaidAt = DateTime.UtcNow;
                invoice.PaymentTransactionId = model.vnp_TransactionNo;
                invoice.PaymentGateway = "VNPay";
                _invoiceService.UpdateInvoice(invoice);

                _contractService.UpdateContractStatus(invoice.ContractId);
                _transactionService.CreateTransaction(invoice.ContractId);

                return Redirect("https://your-frontend.com/payment/success");
            }
        }
        // Payment failed
        return Redirect("https://your-frontend.com/payment/failed");
    }

    [HttpPost("refund/{contractId}")]
    public IActionResult RefundPayment(int contractId)
    {
        var contract = _contractService.GetEntityById(contractId);

        if (contract == null) return NotFound("Contract not found");
        if (contract.Status != RentalStatus.ToBeConfirmed && contract.Status != RentalStatus.Completed)
            return BadRequest("Couldn't refund this contract");
        var result = _transactionService.RefundContract(contract);

        if (result)
        {
            return Ok(new { message = "Refund processed successfully" });
        }
        return BadRequest("Refund failed");
    }
}
