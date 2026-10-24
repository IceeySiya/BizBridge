
using System.Security.Claims;
using BizBridge.Api.DTOs.Business;
using BizBridge.Api.Services.Business;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using BizBridge.Api.Services.Images;
using Microsoft.AspNetCore.Http;

namespace BizBridge.Api.Controllers.Business;

[ApiController]
[Route("api/businesses")]
[Authorize]
public class BusinessController : ControllerBase
{
    private readonly BusinessService _businessService;
    private readonly CloudinaryImageService _imageService;

    public BusinessController(
        BusinessService businessService,
        CloudinaryImageService imageService)
    {
        _businessService = businessService;
        _imageService = imageService;
    }

    // Create a business profile.
    [HttpPost]
    public async Task<IActionResult> CreateBusiness(
        CreateBusinessDto dto)
    {
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

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
                business.Established,
                business.OpeningBalance,
                business.IsVisibleOnExplore,
                business.BusinessEmail,
                business.BusinessPhone,
                business.WebsiteUrl,
                business.ImageUrl
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
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

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
            business.Established,
            business.OpeningBalance,
            business.IsVisibleOnExplore,
            business.BusinessEmail,
            business.BusinessPhone,
            business.WebsiteUrl,
            business.ImageUrl
        });
    }

    // Update the authenticated user's business profile.
    [HttpPut("mine")]
    public async Task<IActionResult> UpdateMyBusiness(
        UpdateBusinessDto dto)
    {
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

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
            business.Established,
            business.OpeningBalance,
            business.IsVisibleOnExplore,
            business.BusinessEmail,
            business.BusinessPhone,
            business.WebsiteUrl,
            business.ImageUrl
        });
    }

    
    // Upload or replace the authenticated user's business image.
    [HttpPost("mine/image")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> UploadMyBusinessImage(
        [FromForm] IFormFile? image,
        CancellationToken cancellationToken)
    {
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        if (image is null || image.Length == 0)
        {
            return BadRequest(new
            {
                message = "Please select an image to upload."
            });
        }

        const long maxBytes = 5 * 1024 * 1024;

        if (image.Length > maxBytes)
        {
            return BadRequest(new
            {
                message = "The image must not exceed 5 MB."
            });
        }

        var allowedTypes = new HashSet<string>(
            StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png",
            "image/webp"
        };

        if (!allowedTypes.Contains(image.ContentType))
        {
            return BadRequest(new
            {
                message = "Only JPEG, PNG, and WebP images are supported."
            });
        }

        var business = await _businessService.GetMyBusinessAsync(userId);

        if (business is null)
        {
            return NotFound(new
            {
                message = "Create your business profile before uploading an image."
            });
        }

        try
        {
            var imageUrl = await _imageService.UploadBusinessImageAsync(
                image,
                cancellationToken);

            var updated = await _businessService.UpdateMyBusinessImageAsync(
                userId,
                imageUrl);

            if (!updated)
            {
                return NotFound(new
                {
                    message = "Your business profile could not be found."
                });
            }

            return Ok(new
            {
                message = "Business image uploaded successfully.",
                imageUrl
            });
        }
        catch (InvalidOperationException)
        {
            return StatusCode(502, new
            {
                message = "The image service could not complete the upload. Please try again."
            });
        }
    }

    
[AllowAnonymous]
[HttpGet("explore")]
public async Task<IActionResult> GetExploreBusinesses()
{
    var businesses = await _businessService.GetVisibleBusinessesAsync();
    return Ok(businesses);
}

[HttpPut("mine/explore-visibility")]
public async Task<IActionResult> UpdateExploreVisibility(
    [FromBody] UpdateExploreVisibilityDto dto)
{
    var userIdClaim =
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    if (!int.TryParse(userIdClaim, out var userId))
    {
        return Unauthorized();
    }

    if (!dto.IsVisibleOnExplore.HasValue)
    {
        return BadRequest(new
        {
            message = "Please specify whether your business should be visible on Explore."
        });
    }

    var business = await _businessService.UpdateMyExploreVisibilityAsync(
        userId,
        dto.IsVisibleOnExplore.Value);

    if (business is null)
    {
        return NotFound(new
        {
            message = "Create your business profile before changing Explore visibility."
        });
    }

    return Ok(new
    {
        message = business.IsVisibleOnExplore
            ? "Your business is now visible on Explore."
            : "Your business is now hidden from Explore.",
        business.IsVisibleOnExplore
    });
}


}
