
using BizBridge.Api.Data;
using BizBridge.Api.DTOs.Business;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace BizBridge.Api.Services.Business;

/// <summary>
/// Handles business profile operations.
/// </summary>
public class BusinessService
{
    private readonly BizBridgeDbContext _context;

    public BusinessService(BizBridgeDbContext context)
    {
        _context = context;
    }

    // Create a business profile for the authenticated user.
    public async Task<Models.Business> CreateBusinessAsync(
        int userId,
        CreateBusinessDto dto)
    {
        var existingBusiness = await _context.Businesses
            .AnyAsync(b => b.OwnerUserID == userId);

        if (existingBusiness)
        {
            throw new InvalidOperationException(
                "You already have a business profile.");
        }

        var business = new Models.Business
        {
            OwnerUserID = userId,
            BusinessName = dto.BusinessName.Trim(),
            Industry = dto.Industry.Trim(),
            Location = dto.Location?.Trim(),
            Description = dto.Description?.Trim(),
            Established = dto.Established ?? DateTimeOffset.UtcNow,
            OpeningBalance = dto.OpeningBalance,

            BusinessEmail = dto.BusinessEmail?.Trim(),
            BusinessPhone = dto.BusinessPhone?.Trim(),
            WebsiteUrl = dto.WebsiteUrl?.Trim(),
            ImageUrl = dto.ImageUrl?.Trim()
        };

        _context.Businesses.Add(business);
        await _context.SaveChangesAsync();

        return business;
    }

    // Retrieve the authenticated user's business profile.
    public async Task<Models.Business?> GetMyBusinessAsync(int userId)
    {
        return await _context.Businesses
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.OwnerUserID == userId);
    }

    // Update the authenticated user's business profile.
    public async Task<Models.Business?> UpdateMyBusinessAsync(
    int userId,
    UpdateBusinessDto dto)
{
    var business = await _context.Businesses
        .FirstOrDefaultAsync(b => b.OwnerUserID == userId);

    if (business is null)
    {
        return null;
    }

    // Update core business details.
    business.BusinessName = dto.BusinessName.Trim();
    business.Industry = dto.Industry.Trim();
    business.Location = dto.Location?.Trim();
    business.Description = dto.Description?.Trim();

    // Update the established date only when provided.
    if (dto.Established.HasValue)
    {
        business.Established = dto.Established.Value;
    }

    // Update contact and online presence details.
    business.BusinessEmail = dto.BusinessEmail?.Trim();
    business.BusinessPhone = dto.BusinessPhone?.Trim();
    business.WebsiteUrl = dto.WebsiteUrl?.Trim();

    // Preserve ImageUrl.
    // Image changes are handled by UpdateMyBusinessImageAsync().

    await _context.SaveChangesAsync();

    return business;
}

    
    // Save the uploaded image URL for the authenticated user's business.
    public async Task<bool> UpdateMyBusinessImageAsync(
        int userId,
        string imageUrl)
    {
        var business = await _context.Businesses
            .FirstOrDefaultAsync(b => b.OwnerUserID == userId);

        if (business is null)
        {
            return false;
        }

        business.ImageUrl = imageUrl;

        await _context.SaveChangesAsync();

        return true;
    }


    
public async Task<List<ExploreBusinessDto>> GetVisibleBusinessesAsync()
{
    return await _context.Businesses
        .AsNoTracking()
        .Where(b => b.IsVisibleOnExplore)
        .OrderBy(b => b.BusinessName)
        .Select(b => new ExploreBusinessDto
        {
            BusinessID = b.BusinessID,
            BusinessName = b.BusinessName,
            Industry = b.Industry,
            Location = b.Location,
            Description = b.Description,
            BusinessEmail = b.BusinessEmail,
            BusinessPhone = b.BusinessPhone,
            WebsiteUrl = b.WebsiteUrl,
            ImageUrl = b.ImageUrl
        })
        .ToListAsync();
}

public async Task<Models.Business?> UpdateMyExploreVisibilityAsync(
    int userId,
    bool isVisibleOnExplore)
{
    var business = await _context.Businesses
        .FirstOrDefaultAsync(b => b.OwnerUserID == userId);

    if (business is null)
    {
        return null;
    }

    business.IsVisibleOnExplore = isVisibleOnExplore;

    await _context.SaveChangesAsync();

    return business;
}


}
