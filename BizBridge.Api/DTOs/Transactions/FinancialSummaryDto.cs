
namespace BizBridge.Api.DTOs.Transactions;

/// <summary>
/// Represents a business's financial summary for a selected period.
/// </summary>
public class FinancialSummaryDto
{
    public int BusinessID { get; set; }

    public DateTime PeriodStart { get; set; }

    public DateTime PeriodEnd { get; set; }

    public decimal TotalIncome { get; set; }

    public decimal TotalExpenses { get; set; }

    public decimal NetCashFlow { get; set; }

    public int TransactionCount { get; set; }
}
