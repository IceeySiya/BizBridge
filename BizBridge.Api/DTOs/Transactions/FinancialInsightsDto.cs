namespace BizBridge.Api.DTOs.Transactions;

public sealed class FinancialInsightsDto
{
    public int BusinessID { get; init; }
    public DateTime PeriodStart { get; init; }
    public DateTime PeriodEnd { get; init; }
    public string Basis { get; init; } = string.Empty;
    public IReadOnlyList<MonthlyCashFlowDto> CashFlowByMonth { get; init; } = [];
    public IReadOnlyList<SpendingPatternDto> SpendingByCategory { get; init; } = [];
    public IReadOnlyList<FinancialWarningDto> Warnings { get; init; } = [];
    public IReadOnlyList<FinancialRecommendationDto> Recommendations { get; init; } = [];
}

public sealed record MonthlyCashFlowDto(
    string Month,
    decimal Income,
    decimal Expenses,
    decimal NetCashFlow,
    int TransactionCount);

public sealed record SpendingPatternDto(
    string Category,
    decimal Total,
    decimal SharePercent);

public sealed record FinancialWarningDto(
    string Level,
    string Message);

public sealed record FinancialRecommendationDto(
    string Message);
