using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.Acc;
using PublicCarRental.Application.Service;
using PublicCarRental.Application.Service.Acc;
using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Application.Service.Inv;
using PublicCarRental.Application.Service.Ren;

[ApiController]
[Route("api/[controller]")]
public class EVRenterController : ControllerBase
{
    private readonly IEVRenterService _eVRenterService;
    private readonly IContractService _contractService;
    private readonly IInvoiceService _invoiceService;
    private readonly IFavoriteService _favoriteService;
    private readonly IAccountService _accountService;

    public EVRenterController(IEVRenterService eVRenterService, IContractService contractService,
        IInvoiceService invoiceService, IFavoriteService favoriteService, IAccountService accountService)
    {
        _eVRenterService = eVRenterService;
        _contractService = contractService;
        _invoiceService = invoiceService;
        _favoriteService = favoriteService;
        _accountService = accountService;
    }

    [HttpGet("all-renters")]
    public IActionResult GetAll()
    {
        var renters = _eVRenterService.GetAll();
        return Ok(renters);
    }

    [HttpGet("filter-by-param/{param}")]
    public IActionResult FilterParam(string param)
    {
        var renters = _eVRenterService.FilterByParam(param);
        return Ok(renters);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var renter =  await _eVRenterService.GetByIdAsync(id);
        if (renter == null)
            return NotFound(new { message = "Renter not found" });

        return Ok(renter);
    }

    [HttpPut("update-renter/{id}")]
    public async Task<IActionResult> UpdateRenterAsync(int id, [FromBody] EVRenterUpdateDto dto)
    {
        var result = await _eVRenterService.UpdateRenterAsync(id, dto);
        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(new { message = result.Message, renterId = id });
    }

    [HttpPost("change-password")]
    public IActionResult ChangePassword([FromForm] int id, [FromForm] ChangePasswordDto dto)
    {
        var accountId = _eVRenterService.GetEntityByIdAsync(id).Result.AccountId;
        var result = _accountService.ChangePassword(accountId, dto);

        if (result.success)
            return Ok(new { result.message });
        else
            return BadRequest(new { error = result.message });
    }

    [HttpDelete("delete-renter/{id}")]
    public async Task<IActionResult> DeleteRenterAsync(int id)
    {
        var success = await _eVRenterService.DeleteRenterAsync(id);
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

    [HttpGet("{renterId}/favorites")]
    public async Task<IActionResult> GetFavoritesAsync(int renterId)
    {
        var favorites = await _favoriteService.GetFavoriteAsync(renterId);
        if (favorites == null)
            return NotFound(new { message = "Renter not found!" });
        return Ok(favorites);
    }

    [HttpDelete("{renterId}/favorites/{modelId}")]
    public async Task<IActionResult> RemoveFavoriteAsync(int renterId, int modelId)
    {
        var success = await _favoriteService.RemoveFavoritesAsync(renterId, modelId);
        if (!success) return BadRequest("Couldn't remove favorite!");
        return Ok("Model removed from favorite successfully!");
    }

    [HttpPost("{renterId}/favorites/{modelId}")]
    public async Task<IActionResult> AddFavoriteAsync(int renterId, int modelId)
    {
        var success = await _favoriteService.AddFavoritesAsync(renterId, modelId);
        if (!success) return BadRequest("Couldn't add favorite!");
        return Ok("Model added to favorite successfully!");
    }

    [HttpGet("{renterId}/contracts")]
    public IActionResult GetUserContracts(int renterId)
    {
        var contracts = _contractService.GetContractByRenterId(renterId);
        return Ok(contracts);
    }

    [HttpGet("{renterId}/invoices")]
    public IActionResult GetUserInvoices(int renterId)
    {
        var invoices = _invoiceService.GetInvoiceByRenterId(renterId);
        return Ok(invoices);
    }
}