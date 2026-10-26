
using System.Security.Claims;
using BizBridge.Api.Services.Transactions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizBridge.Api.Controllers.Transactions;

[ApiController]
[Route("api/businesses/{businessId:int}/predictions")]
[Authorize]
public sealed class FinancialPredictionsController : ControllerBase
{
    private readonly FinancialPredictionService _predictionService;

    public FinancialPredictionsController(
        FinancialPredictionService predictionService)
    {
        _predictionService = predictionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPredictions(int businessId)
    {
        var userIdClaim = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var predictions = await _predictionService.GetPredictionsAsync(
            businessId,
            userId);

        if (predictions is null)
        {
            // Avoid revealing whether another user's business exists.
            return NotFound();
        }

        return Ok(predictions);
    }
}
