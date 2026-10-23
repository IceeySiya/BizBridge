
using System.Security.Claims;
using BizBridge.Api.DTOs.Categories;
using BizBridge.Api.Services.Categories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizBridge.Api.Controllers.Categories;

[ApiController]
[Authorize]
[Route("api/businesses/{businessId:int}/categories")]
public class CategoriesController : ControllerBase
{
    private readonly CategoryService _categoryService;

    public CategoriesController(CategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    /// <summary>
    /// Creates a category or returns an existing matching category.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateCategory(
        int businessId,
        [FromBody] CreateCategoryDto dto)
    {
        // Get the authenticated user's ID from the JWT.
        string? userIdClaim =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized(new
            {
                message = "Unable to identify the authenticated user."
            });
        }

        try
        {
            var category = await _categoryService.CreateOrGetAsync(
                businessId,
                userId,
                dto);

            if (category == null)
            {
                return NotFound(new
                {
                    message = "Business not found or access denied."
                });
            }

            return Ok(new
            {
                message = "Category is ready to use.",
                category = new
                {
                    category.CategoryID,
                    category.BusinessID,
                    category.Name,
                    category.TransactionType,
                    category.IsActive
                }
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    
/// <summary>
/// Retrieves active categories for a business.
/// </summary>
[HttpGet]
public async Task<IActionResult> GetCategories(int businessId)
{
    string? userIdClaim =
        User.FindFirstValue(ClaimTypes.NameIdentifier);

    if (!int.TryParse(userIdClaim, out int userId))
    {
        return Unauthorized(new
        {
            message = "Unable to identify the authenticated user."
        });
    }

    var categories = await _categoryService.GetCategoriesAsync(
        businessId,
        userId);

    if (categories == null)
    {
        return NotFound(new
        {
            message = "Business not found or access denied."
        });
    }

    return Ok(categories.Select(category => new
    {
        category.CategoryID,
        category.BusinessID,
        category.Name,
        category.TransactionType,
        category.IsActive
    }));
}

}
