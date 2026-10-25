
using BizBridge.Api.Data;
using BizBridge.Api.DTOs.Transactions;
using BizBridge.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BizBridge.Api.Services.Transactions;

/// <summary>
/// Contains the business logic for recording and retrieving
/// income and expense transactions.
/// </summary>
public class TransactionService
{
    private readonly BizBridgeDbContext _context;

    public TransactionService(BizBridgeDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Records a transaction after validating business ownership
    /// and category eligibility.
    /// </summary>
    public async Task<(string? Error, Transaction? Transaction)>
        CreateTransactionAsync(
            int businessId,
            int userId,
            CreateTransactionDto dto)
    {
        // Ensure the authenticated user owns this business.
        bool ownsBusiness = await _context.Businesses
            .AnyAsync(b =>
                b.BusinessID == businessId &&
                b.OwnerUserID == userId);

        if (!ownsBusiness)
        {
            return ("Business not found or access denied.", null);
        }

        // Ensure the category belongs to this business and is active.
        var category = await _context.Categories
            .FirstOrDefaultAsync(c =>
                c.CategoryID == dto.CategoryID &&
                c.BusinessID == businessId &&
                c.IsActive);

        if (category == null)
        {
            return (
                "The category does not exist, is inactive, or does not belong to this business.",
                null);
        }

        var transaction = new Transaction
        {
            BusinessID = businessId,
            CategoryID = category.CategoryID,
            Amount = dto.Amount,
            Description = dto.Description?.Trim(),
            PaymentReference = dto.PaymentReference?.Trim(),
            TransactionDate = dto.TransactionDate
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        // Return the saved transaction with its category.
        transaction.Category = category;

        return (null, transaction);
    }

    /// <summary>
    /// Retrieves transactions belonging to a business,
    /// ordered from newest to oldest.
    /// </summary>
    public async Task<(bool BusinessFound, List<Transaction> Transactions)>
        GetTransactionsAsync(int businessId, int userId)
    {
        bool ownsBusiness = await _context.Businesses
            .AnyAsync(b =>
                b.BusinessID == businessId &&
                b.OwnerUserID == userId);

        if (!ownsBusiness)
        {
            return (false, new List<Transaction>());
        }

        var transactions = await _context.Transactions
            .AsNoTracking()
            .Include(t => t.Category)
            .Where(t => t.BusinessID == businessId)
            .OrderByDescending(t => t.TransactionDate)
            .ToListAsync();

        return (true, transactions);
    }

    
/// <summary>
/// Deletes a transaction after validating business ownership.
/// The transaction must belong to the specified business.
/// </summary>
public async Task<bool> DeleteTransactionAsync(
    int businessId,
    int transactionId,
    int userId)
{
    // Confirm that the authenticated user owns the business.
    bool ownsBusiness = await _context.Businesses
        .AnyAsync(b =>
            b.BusinessID == businessId &&
            b.OwnerUserID == userId);

    if (!ownsBusiness)
    {
        return false;
    }

    // Find the transaction only within this business.
    var transaction = await _context.Transactions
        .FirstOrDefaultAsync(t =>
            t.TransactionID == transactionId &&
            t.BusinessID == businessId);

    if (transaction == null)
    {
        return false;
    }

    _context.Transactions.Remove(transaction);

    await _context.SaveChangesAsync();

    return true;
}

}
