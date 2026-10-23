using System.Security.Claims;
using BizBridge.Api.Services.Transactions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizBridge.Api.Controllers.Transactions;

[ApiController]
[Authorize]
[Route("api/businesses/{businessId:int}/financial-insights")]
public sealed class FinancialInsightsController : ControllerBase
{
    private readonly FinancialInsightsService _financialInsightsService;

    public FinancialInsightsController(
        FinancialInsightsService financialInsightsService)
    {
        _financialInsightsService = financialInsightsService;
    }

    [HttpGet]
    public async Task<IActionResult> GetInsights(int businessId)
    {
        if (!int.TryParse(
                User.FindFirstValue(ClaimTypes.NameIdentifier),
                out var userId))
        {
            return Unauthorized(new
            {
                message = "A valid authenticated user ID is required."
            });
        }

        var insights = await _financialInsightsService.GetInsightsAsync(
            businessId,
            userId);

        return insights is null
            ? NotFound(new { message = "Business not found or access denied." })
            : Ok(insights);
    }
}
