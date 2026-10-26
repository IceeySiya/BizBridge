
using BizBridge.Api.DTOs.Transactions;

namespace BizBridge.Api.Services.Transactions;

public sealed class FinancialPredictionService
{
    private readonly FinancialInsightsService _insightsService;
    private readonly FinancialForecastService _forecastService;
    private readonly FinancialPredictionWarningService _warningService;

    public FinancialPredictionService(
        FinancialInsightsService insightsService,
        FinancialForecastService forecastService,
        FinancialPredictionWarningService warningService)
    {
        _insightsService = insightsService;
        _forecastService = forecastService;
        _warningService = warningService;
    }

    public async Task<FinancialPredictionsDto?> GetPredictionsAsync(
        int businessId,
        int userId)
    {
        var insights = await _insightsService.GetInsightsAsync(
            businessId,
            userId);

        if (insights is null)
            return null;

        var forecast = await _forecastService.GetForecastAsync(
            businessId,
            userId);

        if (forecast is null)
            return null;

        var warnings = _warningService.GetWarnings(forecast);

        // Use the current UTC calendar month as the reference.
        var todayUtc = DateTime.UtcNow.Date;
        var currentMonth = new DateTime(
            todayUtc.Year,
            todayUtc.Month,
            1);

        // Three completed months immediately before this month.
        var firstHistoricalMonth = currentMonth.AddMonths(-3);

        var historicalByMonth = insights.CashFlowByMonth
            .ToDictionary(item => item.Month);

        var chartPoints = Enumerable.Range(0, 3)
            .Select(offset => firstHistoricalMonth.AddMonths(offset))
            .Select(month =>
            {
                var monthKey = month.ToString("yyyy-MM");

                historicalByMonth.TryGetValue(
                    monthKey,
                    out var historical);

                return new CashFlowChartPointDto(
                    Month: month.ToString("MMM yyyy"),
                    ActualNetCashFlow: historical?.NetCashFlow ?? 0m,
                    PredictedNetCashFlow: null,
                    Type: "Actual");
            })
            .ToList();

        // Add the next calendar month as the forecast point,
        // but only when the forecast service says it is available.
        if (forecast.IsForecastAvailable)
        {
            var forecastMonth = currentMonth.AddMonths(1);

            chartPoints.Add(new CashFlowChartPointDto(
                Month: forecastMonth.ToString("MMM yyyy"),
                ActualNetCashFlow: null,
                PredictedNetCashFlow: forecast.ForecastNetCashFlow,
                Type: "Predicted"));
        }

        return new FinancialPredictionsDto
        {
            BusinessID = businessId,
            HistoricalInsights = insights,
            Forecast = forecast,
            PredictionWarnings = warnings,
            CashFlowChart = chartPoints
        };
    }
}
