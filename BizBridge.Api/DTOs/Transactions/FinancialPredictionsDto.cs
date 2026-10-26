
namespace BizBridge.Api.DTOs.Transactions;

public sealed class FinancialPredictionsDto
{
    public int BusinessID { get; init; }

    public FinancialInsightsDto HistoricalInsights { get; init; } = new();

    public FinancialForecastDto Forecast { get; init; } = new();

    public IReadOnlyList<FinancialWarningDto> PredictionWarnings { get; init; } = [];

    public IReadOnlyList<CashFlowChartPointDto> CashFlowChart { get; init; } = [];
}
