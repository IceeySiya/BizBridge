
namespace BizBridge.Api.Models;

/// <summary>
/// Represents a category used to classify business transactions.
/// Each category is either Income or Expense.
/// </summary>
public class Category
{
    public int CategoryID {get; set;}
    public string Name {get; set;} = string.Empty;
    public string TransactionType {get; set;} = string.Empty;
    public bool IsActive {get; set;} = true;
}