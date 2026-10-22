using System.Security.Claims;
using BizBridge.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BizBridge.Api.Controllers.Payments;

[ApiController]
[Route("api/payment-alerts")]
[Authorize]
public class PaymentAlertsController : ControllerBase
{
    private readonly BizBridgeDbContext _context;

    public PaymentAlertsController(BizBridgeDbContext context)
    {
        _context = context;
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMyAlerts(
        [FromQuery] int limit = 10)
    {
        if (!int.TryParse(
                User.FindFirstValue(ClaimTypes.NameIdentifier),
                out var userId))
        {
            return Unauthorized();
        }

        limit = Math.Clamp(limit, 1, 50);
        var alerts = await _context.PaymentAlerts
            .AsNoTracking()
            .Where(alert => alert.Transaction.Business.OwnerUserID == userId)
            .OrderByDescending(alert => alert.CreatedAt)
            .Take(limit)
            .Select(alert => new
            {
                alert.AlertID,
                alert.AlertType,
                alert.Message,
                alert.Status,
                alert.CreatedAt,
                transactionAmount = alert.Transaction.Amount,
                paymentReference = alert.Transaction.PaymentReference,
                transactionDescription = alert.Transaction.Description
            })
            .ToListAsync();

        return Ok(alerts);
    }
}
