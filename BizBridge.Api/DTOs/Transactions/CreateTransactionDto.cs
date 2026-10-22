using System.ComponentModel.DataAnnotations;

namespace BizBridge.Api.DTOs.Transactions;

public class CreateTransactionDto
{
    [Required]
    [RegularExpression("^(Income|Expense)$", ErrorMessage = "Transaction type must be Income or Expense.")]
    public string TransactionType { get; set; } = string.Empty;

    [Required]
    [StringLength(80, MinimumLength = 2)]
    public string Category { get; set; } = string.Empty;

    [Range(
        typeof(decimal),
        "0.01",
        "9999999999.99",
        ParseLimitsInInvariantCulture = true)]
    public decimal Amount { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    [StringLength(150)]
    public string? PaymentReference { get; set; }

    public DateTimeOffset? TransactionDate { get; set; }
}
