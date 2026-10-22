
using System.ComponentModel.DataAnnotations;

namespace BizBridge.Api.DTOs.Transactions;

/// <summary>
/// Contains the information required to record
/// an income or expense transaction.
/// </summary>
public class CreateTransactionDto
{
    [Required]
    [Range(1, int.MaxValue)]
    public int CategoryID { get; set; }

    [Required]
    [Range(0.01, 9999999999.99)]
    public decimal Amount { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    [StringLength(150)]
    public string? PaymentReference { get; set; }

    public DateTimeOffset TransactionDate { get; set; }
        = DateTimeOffset.UtcNow;
}
