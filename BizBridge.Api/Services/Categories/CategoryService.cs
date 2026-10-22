
using BizBridge.Api.Data;
using BizBridge.Api.DTOs.Categories;
using BizBridge.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BizBridge.Api.Services.Categories;

/// <summary>
/// Handles category creation and reuse for business transactions.
/// </summary>
public class CategoryService
{
    private readonly BizBridgeDbContext _context;

    public CategoryService(BizBridgeDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Returns an existing category or creates a new one.
    /// Only the owner of the business can manage its categories.
    /// Returns null if the business does not belong to the user.
    /// </summary>
    public async Task<Category?> CreateOrGetAsync(
        int businessId,
        int userId,
        CreateCategoryDto dto)
    {
        // Verify that the authenticated user owns the business.
        bool ownsBusiness = await _context.Businesses
            .AnyAsync(b =>
                b.BusinessID == businessId &&
                b.OwnerUserID == userId);

        if (!ownsBusiness)
        {
            return null;
        }

        // Normalize input to avoid whitespace and casing differences.
        string name = dto.Name.Trim();
        string transactionType = dto.TransactionType.Trim();

        if (transactionType != "Income" &&
            transactionType != "Expense")
        {
            throw new ArgumentException(
                "Transaction type must be Income or Expense.");
        }

        // Reuse an existing category when it matches.
        Category? existingCategory = await _context.Categories
            .FirstOrDefaultAsync(c =>
                c.BusinessID == businessId &&
                c.Name.ToLower() == name.ToLower() &&
                c.TransactionType == transactionType);

        if (existingCategory != null)
        {
            return existingCategory;
        }

        // Create the category only if it does not exist.
        var category = new Category
        {
            BusinessID = businessId,
            Name = name,
            TransactionType = transactionType,
            IsActive = true
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return category;
    }
}
