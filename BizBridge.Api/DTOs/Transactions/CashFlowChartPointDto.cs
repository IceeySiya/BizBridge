
namespace BizBridge.Api.DTOs.Transactions;

public sealed record CashFlowChartPointDto(
    string Month,
    decimal? ActualNetCashFlow,
    decimal? PredictedNetCashFlow,
    string Type);
