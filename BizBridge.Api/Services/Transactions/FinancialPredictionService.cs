
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

        return new FinancialPredictionsDto
        {
            BusinessID = businessId,
            HistoricalInsights = insights,
            Forecast = forecast,
            PredictionWarnings = warnings
        };
    }
}
