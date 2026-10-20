
using BizBridge.Api.Data;
using BizBridge.Api.DTOs.Business;
using Microsoft.EntityFrameworkCore;

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
            Established = dto.Established ?? DateTimeOffset.UtcNow
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

        business.BusinessName = dto.BusinessName.Trim();
        business.Industry = dto.Industry.Trim();
        business.Location = dto.Location?.Trim();
        business.Description = dto.Description?.Trim();

        if (dto.Established.HasValue)
        {
            business.Established = dto.Established.Value;
        }

        await _context.SaveChangesAsync();

        return business;
    }
}
