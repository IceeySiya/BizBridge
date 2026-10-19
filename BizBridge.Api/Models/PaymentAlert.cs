
namespace BizBridge.Api.Models;

/// <summary>
/// Represents an alert raised for a transaction
/// that may require further review.
/// An alert does not prove that fraud occurred.
/// </summary>
public class PaymentAlert
{
    public int AlertID {get; set;}
     // Foreign key referencing Transactions.TransactionId.
    public int TransactionId { get; set; } 
    public string AlertType { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = "Open";
    public DateTimeOffset CreatedAt { get; set; }

    // Navigation property for the related transaction.
    public Transaction Transaction { get; set; } = null!;
}