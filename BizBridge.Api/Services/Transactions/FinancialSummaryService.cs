
using BizBridge.Api.Data;
using BizBridge.Api.DTOs.Transactions;
using Microsoft.EntityFrameworkCore;

namespace BizBridge.Api.Services.Transactions;

/// <summary>
/// Calculates financial summaries from recorded business transactions.
/// </summary>
public class FinancialSummaryService
{
    private readonly BizBridgeDbContext _context;

    public FinancialSummaryService(BizBridgeDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Calculates financial totals for a business and date range.
    /// Dates are inclusive; the end date includes the entire day.
    /// If no dates are supplied, the current UTC month is used.
    /// </summary>
    public async Task<FinancialSummaryDto?> GetSummaryAsync(
        int businessId,
        int userId,
        DateTime? startDate = null,
        DateTime? endDate = null)
    {
        // Verify business ownership before retrieving financial data.
        bool ownsBusiness = await _context.Businesses
            .AnyAsync(b =>
                b.BusinessID == businessId &&
                b.OwnerUserID == userId);

        if (!ownsBusiness)
        {
            return null;
        }

        DateTime today = DateTime.UtcNow.Date;

        DateTime periodStart = startDate?.Date
            ?? new DateTime(today.Year, today.Month, 1);

        DateTime periodEnd = endDate?.Date ?? today;

        if (periodStart > periodEnd)
        {
            throw new ArgumentException(
                "The start date cannot be after the end date.");
        }

        // Use an exclusive upper boundary so the entire end date
        // is included, including transactions later in the day.
        DateTime exclusiveEnd = periodEnd.AddDays(1);

        var transactions = _context.Transactions
            .AsNoTracking()
            .Where(t =>
                t.BusinessID == businessId &&
                t.TransactionDate >= periodStart &&
                t.TransactionDate < exclusiveEnd);

        var totals = await transactions
            .GroupBy(_ => 1)
            .Select(group => new
            {
                TotalIncome = group
                    .Where(t => t.Category.TransactionType == "Income")
                    .Sum(t => (decimal?)t.Amount) ?? 0m,

                TotalExpenses = group
                    .Where(t => t.Category.TransactionType == "Expense")
                    .Sum(t => (decimal?)t.Amount) ?? 0m,

                TransactionCount = group.Count()
            })
            .FirstOrDefaultAsync();

        decimal totalIncome = totals?.TotalIncome ?? 0m;
        decimal totalExpenses = totals?.TotalExpenses ?? 0m;

        return new FinancialSummaryDto
        {
            BusinessID = businessId,
            PeriodStart = periodStart,
            PeriodEnd = periodEnd,
            TotalIncome = totalIncome,
            TotalExpenses = totalExpenses,
            NetCashFlow = totalIncome - totalExpenses,
            TransactionCount = totals?.TransactionCount ?? 0
        };
    }
}
