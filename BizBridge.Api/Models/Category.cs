
namespace BizBridge.Api.Models;

/// <summary>
/// Represents a custom income or expense category
/// created for a specific business.
/// </summary>
public class Category
{
    public int CategoryID { get; set; }

    public int BusinessID { get; set; }

    public string Name { get; set; } = string.Empty;

    public string TransactionType { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    // Navigation property.
    public Business Business { get; set; } = null!;
}
