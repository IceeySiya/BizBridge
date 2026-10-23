using BizBridge.Api.Data;
using BizBridge.Api.DTOs.Transactions;
using System.Globalization;
using Microsoft.EntityFrameworkCore;

namespace BizBridge.Api.Services.Transactions;

public sealed class FinancialInsightsService
{
    private readonly BizBridgeDbContext _context;

    public FinancialInsightsService(BizBridgeDbContext context)
    {
        _context = context;
    }

    public async Task<FinancialInsightsDto?> GetInsightsAsync(
        int businessId,
        int userId)
    {
        var ownsBusiness = await _context.Businesses
            .AnyAsync(business =>
                business.BusinessID == businessId &&
                business.OwnerUserID == userId);

        if (!ownsBusiness)
        {
            return null;
        }

        var todayUtc = DateTime.UtcNow.Date;
        var currentMonth = new DateTime(
            todayUtc.Year,
            todayUtc.Month,
            1,
            0,
            0,
            0,
            DateTimeKind.Utc);
        var periodStart = currentMonth.AddMonths(-5);
        var periodEnd = todayUtc.AddDays(1);
        var periodStartOffset = new DateTimeOffset(periodStart);
        var periodEndOffset = new DateTimeOffset(periodEnd);

        var transactions = await _context.Transactions
            .AsNoTracking()
            .Where(transaction =>
                transaction.BusinessID == businessId &&
                transaction.TransactionDate >= periodStartOffset &&
                transaction.TransactionDate < periodEndOffset)
            .Select(transaction => new
            {
                transaction.Amount,
                transaction.TransactionDate,
                transaction.Category.Name,
                transaction.Category.TransactionType
            })
            .ToListAsync();

        var cashFlowByMonth = Enumerable.Range(0, 6)
            .Select(offset => periodStart.AddMonths(offset))
            .Select(month =>
            {
                var monthTransactions = transactions
                    .Where(transaction =>
                        transaction.TransactionDate.UtcDateTime.Year == month.Year &&
                        transaction.TransactionDate.UtcDateTime.Month == month.Month)
                    .ToArray();

                var income = monthTransactions
                    .Where(transaction =>
                        transaction.TransactionType == "Income")
                    .Sum(transaction => transaction.Amount);
                var expenses = monthTransactions
                    .Where(transaction =>
                        transaction.TransactionType == "Expense")
                    .Sum(transaction => transaction.Amount);

                return new MonthlyCashFlowDto(
                    month.ToString("yyyy-MM"),
                    income,
                    expenses,
                    income - expenses,
                    monthTransactions.Length);
            })
            .ToArray();

        var previousMonth = currentMonth.AddMonths(-1);
        var previousMonthElapsedDays = Math.Min(
            todayUtc.Day,
            DateTime.DaysInMonth(
                previousMonth.Year,
                previousMonth.Month));
        var previousMonthEnd = previousMonth.AddDays(
            previousMonthElapsedDays);
        var previousMonthToDateExpenses = transactions
            .Where(transaction =>
                transaction.TransactionType == "Expense" &&
                transaction.TransactionDate.UtcDateTime >= previousMonth &&
                transaction.TransactionDate.UtcDateTime < previousMonthEnd)
            .Sum(transaction => transaction.Amount);

        var totalExpenses = transactions
            .Where(transaction => transaction.TransactionType == "Expense")
            .Sum(transaction => transaction.Amount);
        var spendingByCategory = transactions
            .Where(transaction => transaction.TransactionType == "Expense")
            .GroupBy(transaction => transaction.Name)
            .Select(group => new SpendingPatternDto(
                group.Key,
                group.Sum(transaction => transaction.Amount),
                totalExpenses == 0
                    ? 0
                    : decimal.Round(
                        group.Sum(transaction => transaction.Amount) /
                        totalExpenses * 100m,
                        1)))
            .OrderByDescending(pattern => pattern.Total)
            .ToArray();

        var warnings = new List<FinancialWarningDto>();
        var current = cashFlowByMonth[^1];

        if (transactions.Count == 0)
        {
            warnings.Add(new FinancialWarningDto(
                "information",
                "No transactions are recorded for this six-month period. Add income and expense records to see cash-flow trends and spending patterns."));
        }
        else if (current.NetCashFlow < 0)
        {
            var shortfall = Math.Abs(current.NetCashFlow)
                .ToString("N2", CultureInfo.GetCultureInfo("en-ZA"));
            warnings.Add(new FinancialWarningDto(
                "warning",
                $"For {current.Month}, recorded expenses exceeded recorded income by R{shortfall}. This describes recorded transactions only; it is not a forecast."));
        }

        if (previousMonthToDateExpenses > 0 &&
            current.Expenses >= previousMonthToDateExpenses * 1.2m)
        {
            var increasePercent = decimal.Round(
                (current.Expenses - previousMonthToDateExpenses) /
                previousMonthToDateExpenses * 100m);
            warnings.Add(new FinancialWarningDto(
                "warning",
                $"Recorded expenses for {current.Month} to date are {increasePercent}% higher than the same elapsed calendar period in {previousMonth:yyyy-MM}. The comparison uses only transactions entered in BizBridge and does not predict future spending."));
        }

        return new FinancialInsightsDto
        {
            BusinessID = businessId,
            PeriodStart = periodStart,
            PeriodEnd = todayUtc,
            Basis = "These summaries use transactions recorded in BizBridge for the last six calendar months, including the current month to date. Missing or unrecorded transactions are not included. Warnings describe historical records and are not guaranteed predictions or financial advice.",
            CashFlowByMonth = cashFlowByMonth,
            SpendingByCategory = spendingByCategory,
            Warnings = warnings
        };
    }
}
