
using System.Globalization;
using BizBridge.Api.DTOs.Transactions;

namespace BizBridge.Api.Services.Transactions;

public sealed class FinancialForecastService
{
    private readonly FinancialInsightsService _insightsService;
    private readonly FinancialSummaryService _summaryService;

    public FinancialForecastService(
        FinancialInsightsService insightsService,
        FinancialSummaryService summaryService)
    {
        _insightsService = insightsService;
        _summaryService = summaryService;
    }

    public async Task<FinancialForecastDto?> GetForecastAsync(
        int businessId,
        int userId)
    {
        // Reuse existing services, which verify business ownership.
        var insights = await _insightsService.GetInsightsAsync(
            businessId,
            userId);

        if (insights is null)
        {
            return null;
        }

        var summary = await _summaryService.GetSummaryAsync(
            businessId,
            userId);

        if (summary is null)
        {
            return null;
        }

        var today = DateTime.UtcNow.Date;
        var currentMonth = new DateTime(today.Year, today.Month, 1);

        // Forecast the next calendar month.
        var forecastStart = currentMonth.AddMonths(1);
        var forecastEnd = forecastStart.AddMonths(1).AddDays(-1);

        // Use the three complete months before the current month.
        var historicalMonths = Enumerable.Range(1, 3)
            .Select(offset => currentMonth.AddMonths(-offset))
            .OrderBy(month => month)
            .ToArray();

        var monthlyData = insights.CashFlowByMonth
            .ToDictionary(
                item => item.Month,
                item => item);

        var selectedMonths = historicalMonths
            .Where(month => monthlyData.ContainsKey(
                month.ToString("yyyy-MM", CultureInfo.InvariantCulture)))
            .Select(month => monthlyData[
                month.ToString("yyyy-MM", CultureInfo.InvariantCulture)])
            .ToArray();

        var warnings = new List<FinancialWarningDto>();

        // Require all three months to be present and contain
        // at least one recorded transaction.
        bool hasEnoughData =
            selectedMonths.Length == 3 &&
            selectedMonths.All(month => month.TransactionCount > 0);

        if (!hasEnoughData)
        {
            warnings.Add(new FinancialWarningDto(
                "information",
                "There is not enough recorded transaction activity in each of the last three complete months to produce a reliable forecast. Continue recording income and expenses to build a useful history."));

            return new FinancialForecastDto
            {
                BusinessID = businessId,
                ForecastPeriodStart = forecastStart,
                ForecastPeriodEnd = forecastEnd,
                HistoricalMonthsUsed = selectedMonths.Length,
                CurrentBalance = summary.CurrentBalance,
                ProjectedClosingBalance = summary.CurrentBalance,
                IsForecastAvailable = false,
                Basis = "Forecast unavailable. A reliable estimate requires recorded transactions in all three previous complete calendar months.",
                Warnings = warnings
            };
        }

        decimal averageIncome = selectedMonths.Average(
            month => month.Income);

        decimal averageExpenses = selectedMonths.Average(
            month => month.Expenses);

        decimal forecastIncome = decimal.Round(
            averageIncome, 2, MidpointRounding.AwayFromZero);

        decimal forecastExpenses = decimal.Round(
            averageExpenses, 2, MidpointRounding.AwayFromZero);

        decimal forecastNetCashFlow =
            forecastIncome - forecastExpenses;

        decimal projectedClosingBalance =
            summary.CurrentBalance + forecastNetCashFlow;

        if (forecastNetCashFlow < 0)
        {
            warnings.Add(new FinancialWarningDto(
                "warning",
                "Based on the average recorded income and expenses from the last three complete months, expenses are projected to exceed income next month. Review expected costs and income before making financial decisions."));
        }

        if (projectedClosingBalance < 0)
        {
            warnings.Add(new FinancialWarningDto(
                "warning",
                "The estimated closing balance is below zero if the forecast assumptions hold. Review upcoming payments, available funds and expected income."));
        }

        return new FinancialForecastDto
        {
            BusinessID = businessId,
            ForecastPeriodStart = forecastStart,
            ForecastPeriodEnd = forecastEnd,
            HistoricalMonthsUsed = 3,
            AverageMonthlyIncome = decimal.Round(
                averageIncome, 2, MidpointRounding.AwayFromZero),
            AverageMonthlyExpenses = decimal.Round(
                averageExpenses, 2, MidpointRounding.AwayFromZero),
            ForecastIncome = forecastIncome,
            ForecastExpenses = forecastExpenses,
            ForecastNetCashFlow = forecastNetCashFlow,
            CurrentBalance = summary.CurrentBalance,
            IsForecastAvailable = true,
            ProjectedClosingBalance = projectedClosingBalance,
            Basis = "Estimates use the average recorded income and expenses from the three complete calendar months before the current month. The projected closing balance adds estimated net cash flow to the current balance. Unrecorded transactions, seasonality and future changes are not accounted for. This is an estimate, not a guarantee.",
            Warnings = warnings
        };
    }
}
