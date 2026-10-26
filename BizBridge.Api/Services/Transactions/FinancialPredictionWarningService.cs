
using BizBridge.Api.DTOs.Transactions;

namespace BizBridge.Api.Services.Transactions;

public sealed class FinancialPredictionWarningService
{
    public IReadOnlyList<FinancialWarningDto> GetWarnings(
        FinancialForecastDto forecast)
    {
        var warnings = new List<FinancialWarningDto>();

        if (!forecast.IsForecastAvailable)
        {
            warnings.Add(new FinancialWarningDto(
                "information",
                "A forecast is not available yet. Record sufficient transaction history across the previous three complete calendar months."
            ));

            return warnings;
        }

        if (forecast.ForecastNetCashFlow < 0)
        {
            warnings.Add(new FinancialWarningDto(
                "warning",
                "Your forecast expenses exceed your forecast income. Review spending and plan for upcoming payments."
            ));
        }

        if (forecast.ProjectedClosingBalance < 0)
        {
            warnings.Add(new FinancialWarningDto(
                "warning",
                "Your projected closing balance is negative. You may need to reduce expenses or identify additional income."
            ));
        }

        if (warnings.Count == 0)
        {
            warnings.Add(new FinancialWarningDto(
                "information",
                "No negative cash-flow or negative-balance warning was identified by this forecast."
            ));
        }

        return warnings;
    }
}
