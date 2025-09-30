using Microsoft.AspNetCore.Mvc;
using PublicCarRental.DTOs.Acc;
using PublicCarRental.Service.Cont;
using PublicCarRental.Service.Inv;
using PublicCarRental.Service.Renter;

[ApiController]
[Route("api/[controller]")]
public class EVRenterController : ControllerBase
{
    private readonly IEVRenterService _eVRenterService;
    private readonly IContractService _contractService;
    private readonly IInvoiceService _invoiceService;

    public EVRenterController(IEVRenterService eVRenterService, IContractService contractService, IInvoiceService invoiceService)
    {
        _eVRenterService = eVRenterService;
        _contractService = contractService;
        _invoiceService = invoiceService;
    }

    [HttpGet("all-renters")]
    public IActionResult GetAll()
    {
        var renters = _eVRenterService.GetAll(); 
        return Ok(renters);
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var renter = _eVRenterService.GetById(id);
        if (renter == null)
            return NotFound(new { message = "Renter not found" });

        return Ok(renter);
    }

    [HttpPut("update-renter/{id}")]
    public IActionResult UpdateRenter(int id, [FromBody] AccountDto dto)
    {
        var success = _eVRenterService.UpdateRenter(id, dto);
        if (!success)
            return NotFound(new { message = "Renter not found" });
        return Ok(new { message = "Renter updated", renterId = id });
    }

    [HttpDelete("delete-renter/{id}")]
    public IActionResult DeleteRenter(int id)
    {
        var success = _eVRenterService.DeleteRenter(id);
        if (!success)
            return NotFound(new { message = "Renter not found" });

        return Ok(new { message = "Renter deleted", renterId = id });
    }

    [HttpPost("change-status/{id}")]
    public IActionResult ChangeRenterStatus(int id)
    {
        var success = _eVRenterService.ChangeStatus(id);
        if (!success) return NotFound("Renter not found");
        return Ok($"Renter status changed");
    }

    [HttpGet("{userId}/contracts")]
    public IActionResult GetUserContracts(int userId)
    {
        var contracts = _contractService.GetContractByRenterId(userId);
        return Ok(contracts);
    }

    [HttpGet("{userId}/invoices")]
    public IActionResult GetUserInvoices(int userId)
    {
        var invoices = _invoiceService.GetInvoiceByRenterId(userId);
        return Ok(invoices);
    }
}