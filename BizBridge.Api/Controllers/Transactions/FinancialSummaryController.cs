
using System.Security.Claims;
using BizBridge.Api.Services.Transactions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizBridge.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/businesses/{businessId:int}/financial-summary")]
public class FinancialSummaryController : ControllerBase
{
    private readonly FinancialSummaryService _financialSummaryService;

    public FinancialSummaryController(
        FinancialSummaryService financialSummaryService)
    {
        _financialSummaryService = financialSummaryService;
    }

    [HttpGet]
    public async Task<IActionResult> GetSummary(
        int businessId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        string? userIdClaim =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized(new
            {
                message =
                    "A valid authenticated user ID is required."
            });
        }

        try
        {
            var summary =
                await _financialSummaryService.GetSummaryAsync(
                    businessId,
                    userId,
                    startDate,
                    endDate);

            if (summary is null)
            {
                return NotFound(new
                {
                    message =
                        "Business not found or access denied."
                });
            }

            return Ok(summary);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }
}
