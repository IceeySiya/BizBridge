using System.Security.Claims;
using BizBridge.Api.Data;
using BizBridge.Api.DTOs.Readiness;
using BizBridge.Api.Models;
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
        if (!TryGetUserId(out var userId))
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

        var progress = await _context.BusinessReadiness
            .AsNoTracking()
            .Where(item => item.BusinessID == business.BusinessID)
            .ToDictionaryAsync(item => item.CheckID);

        var checks = ReadinessChecklist.Items.Select(item =>
        {
            var isCompleted = item.IsAutomatic
                ? item.Key switch
                {
                    "business-profile" =>
                        !string.IsNullOrWhiteSpace(business.BusinessName) &&
                        !string.IsNullOrWhiteSpace(business.Industry),
                    "financial-records" => hasFinancialRecords,
                    _ => false
                }
                : progress.TryGetValue(item.CheckID, out var savedProgress) &&
                    savedProgress.IsCompleted;

            return new
            {
                id = item.Key,
                checkId = item.CheckID,
                title = item.Title,
                description = item.Description,
                isRequired = true,
                isCompleted,
                canEdit = !item.IsAutomatic,
                nextStep = item.NextStep,
                actionUrl = item.ActionUrl,
                completedAt = item.IsAutomatic
                    ? null
                    : progress.TryGetValue(item.CheckID, out var saved)
                        ? saved.CompletedAt
                        : null
            };
        }).ToArray();
        var missingRequirements = checks
            .Where(check => !check.isCompleted)
            .ToArray();
        var completedCount = checks.Count(check => check.isCompleted);

        return Ok(new
        {
            completedCount,
            totalCount = checks.Length,
            progressPercent = (int)Math.Round(
                completedCount * 100d / checks.Length),
            basis = "Progress combines profile and transaction records in BizBridge with items you mark complete. Self-reported items are not independently verified; this is not a credit score or guarantee of eligibility.",
            checks,
            missingRequirements,
            recommendedNextSteps = missingRequirements
                .Select(check => new
                {
                    check.id,
                    check.title,
                    check.nextStep,
                    check.actionUrl
                })
                .ToArray()
        });
    }

    [HttpPut("mine/{checkId:int}")]
    public async Task<IActionResult> UpdateMyReadiness(
        int checkId,
        [FromBody] UpdateReadinessDto dto)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var business = await _context.Businesses
            .FirstOrDefaultAsync(item => item.OwnerUserID == userId);

        if (business is null)
        {
            return NotFound(new { message = "Create a business profile first." });
        }

        var check = ReadinessChecklist.Items
            .FirstOrDefault(item => item.CheckID == checkId);

        if (check is null)
        {
            return NotFound(new { message = "Readiness checklist item not found." });
        }

        if (check.IsAutomatic)
        {
            return BadRequest(new
            {
                message = "This checklist item is completed from your BizBridge records."
            });
        }

        var savedProgress = await _context.BusinessReadiness
            .FirstOrDefaultAsync(item =>
                item.BusinessID == business.BusinessID &&
                item.CheckID == checkId);

        if (savedProgress is null)
        {
            savedProgress = new BusinessReadiness
            {
                BusinessID = business.BusinessID,
                CheckID = checkId
            };
            _context.BusinessReadiness.Add(savedProgress);
        }

        savedProgress.IsCompleted = dto.IsCompleted;
        savedProgress.CompletedAt = dto.IsCompleted
            ? DateTimeOffset.UtcNow
            : null;

        await _context.SaveChangesAsync();
        return await GetMyReadiness();
    }

    private bool TryGetUserId(out int userId)
    {
        return int.TryParse(
            User.FindFirstValue(ClaimTypes.NameIdentifier),
            out userId);
    }
}
