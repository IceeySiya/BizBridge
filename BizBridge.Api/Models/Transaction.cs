
namespace BizBridge.Api.Models;

/// <summary>
/// Represents an income or expense transaction
/// belonging to a registered business.
/// </summary>
public class Transaction
{
    public int TransactionID {get; set;}
    public int BusinessID {get; set;}
    public int CategoryID {get; set;}
    public decimal Amount {get; set;}
    public string? Description {get; set;}
    public string? PaymentReference {get; set;}
     public DateTimeOffset TransactionDate { get; set; }

     // Navigation properties.
    public Business Business { get; set; } = null!;

    public Category Category { get; set; } = null!;


}