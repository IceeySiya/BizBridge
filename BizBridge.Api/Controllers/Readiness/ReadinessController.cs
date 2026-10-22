using System.Security.Claims;
using BizBridge.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BizBridge.Api.Controllers.Readiness;

[ApiController]
[Route("api/readiness")]
[Authorize]
public class ReadinessController : ControllerBase
{
    private readonly BizBridgeDbContext _context;

    public ReadinessController(BizBridgeDbContext context)
    {
        _context = context;
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMyReadiness()
    {
        if (!int.TryParse(
                User.FindFirstValue(ClaimTypes.NameIdentifier),
                out var userId))
        {
            return Unauthorized();
        }

        var business = await _context.Businesses
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.OwnerUserID == userId);

        if (business is null)
        {
            return NotFound(new { message = "Create a business profile first." });
        }

        var hasFinancialRecords = await _context.Transactions
            .AnyAsync(transaction => transaction.BusinessID == business.BusinessID);

        var checks = new[]
        {
            new
            {
                id = "business-profile",
                title = "Create your business profile",
                description = "Add your business name and industry.",
                isCompleted = !string.IsNullOrWhiteSpace(business.BusinessName) &&
                    !string.IsNullOrWhiteSpace(business.Industry)
            },
            new
            {
                id = "financial-records",
                title = "Record business income or expenses",
                description = "A transaction gives you a starting point for financial records.",
                isCompleted = hasFinancialRecords
            }
        };
        var completedCount = checks.Count(check => check.isCompleted);

        return Ok(new
        {
            completedCount,
            totalCount = checks.Length,
            progressPercent = (int)Math.Round(
                completedCount * 100d / checks.Length),
            basis = "Progress reflects profile and transaction records in BizBridge. It is not a credit score, document verification, or guarantee of eligibility.",
            checks
        });
    }
}
