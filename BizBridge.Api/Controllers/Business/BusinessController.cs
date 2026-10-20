
using System.Security.Claims;
using BizBridge.Api.DTOs.Business;
using BizBridge.Api.Services.Business;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizBridge.Api.Controllers.Business;

[ApiController]
[Route("api/businesses")]
[Authorize]
public class BusinessController : ControllerBase
{
    private readonly BusinessService _businessService;

    public BusinessController(BusinessService businessService)
    {
        _businessService = businessService;
    }

    // Create a business profile.
    [HttpPost]
    public async Task<IActionResult> CreateBusiness(
        CreateBusinessDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var business = await _businessService.CreateBusinessAsync(
                userId, dto);

            return Ok(new
            {
                message = "Business profile created successfully.",
                business.BusinessID,
                business.BusinessName,
                business.Industry,
                business.Location,
                business.Description,
                business.Established
            });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    // Get the authenticated user's business profile.
    [HttpGet("mine")]
    public async Task<IActionResult> GetMyBusiness()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var business = await _businessService.GetMyBusinessAsync(userId);

        if (business is null)
        {
            return NotFound(new
            {
                message = "No business profile found. Create one first."
            });
        }

        return Ok(new
        {
            business.BusinessID,
            business.BusinessName,
            business.Industry,
            business.Location,
            business.Description,
            business.Established
        });
    }

    // Update the authenticated user's business profile.
    [HttpPut("mine")]
    public async Task<IActionResult> UpdateMyBusiness(
        UpdateBusinessDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var business = await _businessService.UpdateMyBusinessAsync(
            userId, dto);

        if (business is null)
        {
            return NotFound(new
            {
                message = "No business profile found. Create one first."
            });
        }

        return Ok(new
        {
            message = "Business profile updated successfully.",
            business.BusinessID,
            business.BusinessName,
            business.Industry,
            business.Location,
            business.Description,
            business.Established
        });
    }
}
