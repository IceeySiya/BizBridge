namespace BizBridge.Api.DTOs.Transactions;

/// <summary>
/// Represents an estimated financial forecast for the next calendar month.
/// </summary>
public sealed class FinancialForecastDto
{
    public int BusinessID { get; init; }

    public DateTime ForecastPeriodStart { get; init; }

    public DateTime ForecastPeriodEnd { get; init; }
    public bool IsForecastAvailable { get; init; }

    public int HistoricalMonthsUsed { get; init; }

    public decimal AverageMonthlyIncome { get; init; }

    public decimal AverageMonthlyExpenses { get; init; }

    public decimal ForecastIncome { get; init; }

    public decimal ForecastExpenses { get; init; }

    public decimal ForecastNetCashFlow { get; init; }

    public decimal CurrentBalance { get; init; }

    public decimal ProjectedClosingBalance { get; init; }

    public string Basis { get; init; } = string.Empty;

    public IReadOnlyList<FinancialWarningDto> Warnings { get; init; } = [];
}