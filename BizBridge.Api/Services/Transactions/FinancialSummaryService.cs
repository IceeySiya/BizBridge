
using BizBridge.Api.Data;
using BizBridge.Api.DTOs.Transactions;
using Microsoft.EntityFrameworkCore;

namespace BizBridge.Api.Services.Transactions;

public class FinancialSummaryService
{
    private readonly BizBridgeDbContext _context;

    public FinancialSummaryService(BizBridgeDbContext context)
    {
        _context = context;
    }

    public async Task<FinancialSummaryDto?> GetSummaryAsync(
        int businessId,
        int userId,
        DateTime? startDate = null,
        DateTime? endDate = null)
    {
        // Confirm that this business belongs to the authenticated user.
        var business = await _context.Businesses
            .AsNoTracking()
            .FirstOrDefaultAsync(b =>
                b.BusinessID == businessId &&
                b.OwnerUserID == userId);

        if (business is null)
        {
            return null;
        }

        // Default reporting period: first day of the current month
        // through today's date.
        DateTime today = DateTime.UtcNow.Date;

        DateTime periodStartDate = startDate?.Date
            ?? new DateTime(today.Year, today.Month, 1);

        DateTime periodEndDate = endDate?.Date ?? today;

        if (periodStartDate > periodEndDate)
        {
            throw new ArgumentException(
                "The start date cannot be after the end date.");
        }

        // Use an inclusive start and exclusive end so transactions
        // occurring at any time on the final day are included.
        DateTimeOffset periodStart = new(
            DateTime.SpecifyKind(
                periodStartDate,
                DateTimeKind.Utc));

        DateTimeOffset exclusiveEnd = new(
            DateTime.SpecifyKind(
                periodEndDate.AddDays(1),
                DateTimeKind.Utc));

        // ---------------------------------------------------------
        // ALL-TIME TOTALS: used to calculate the current balance.
        // ---------------------------------------------------------
        var allTransactions = _context.Transactions
            .AsNoTracking()
            .Where(t => t.BusinessID == businessId);

        var allTimeTotals = await allTransactions
            .GroupBy(t => t.BusinessID)
            .Select(group => new
            {
                TotalIncome = group
                    .Where(t =>
                        t.Category.TransactionType == "Income")
                    .Sum(t => (decimal?)t.Amount) ?? 0m,

                TotalExpenses = group
                    .Where(t =>
                        t.Category.TransactionType == "Expense")
                    .Sum(t => (decimal?)t.Amount) ?? 0m
            })
            .FirstOrDefaultAsync();

        decimal allTimeIncome =
            allTimeTotals?.TotalIncome ?? 0m;

        decimal allTimeExpenses =
            allTimeTotals?.TotalExpenses ?? 0m;

        decimal openingBalance = business.OpeningBalance;

        decimal currentBalance =
            openingBalance + allTimeIncome - allTimeExpenses;

        // ---------------------------------------------------------
        // SELECTED-PERIOD TOTALS: used for the financial report.
        // ---------------------------------------------------------
        var periodTransactions = _context.Transactions
            .AsNoTracking()
            .Where(t =>
                t.BusinessID == businessId &&
                t.TransactionDate >= periodStart &&
                t.TransactionDate < exclusiveEnd);

        var periodTotals = await periodTransactions
            .GroupBy(t => t.BusinessID)
            .Select(group => new
            {
                TotalIncome = group
                    .Where(t =>
                        t.Category.TransactionType == "Income")
                    .Sum(t => (decimal?)t.Amount) ?? 0m,

                TotalExpenses = group
                    .Where(t =>
                        t.Category.TransactionType == "Expense")
                    .Sum(t => (decimal?)t.Amount) ?? 0m,

                TransactionCount = group.Count()
            })
            .FirstOrDefaultAsync();

        decimal totalIncome =
            periodTotals?.TotalIncome ?? 0m;

        decimal totalExpenses =
            periodTotals?.TotalExpenses ?? 0m;

        return new FinancialSummaryDto
        {
            BusinessID = businessId,

            PeriodStart = periodStartDate,
            PeriodEnd = periodEndDate,

            OpeningBalance = openingBalance,
            CurrentBalance = currentBalance,

            TotalIncome = totalIncome,
            TotalExpenses = totalExpenses,

            NetCashFlow = totalIncome - totalExpenses,

            TransactionCount =
                periodTotals?.TransactionCount ?? 0
        };
    }
}
