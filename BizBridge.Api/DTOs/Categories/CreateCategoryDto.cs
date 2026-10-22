
using System.ComponentModel.DataAnnotations;

namespace BizBridge.Api.DTOs.Categories;

/// <summary>
/// Contains the information needed to create
/// a business-specific transaction category.
/// </summary>
public class CreateCategoryDto
{
    [Required]
    [StringLength(80, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^(Income|Expense)$",
        ErrorMessage = "Transaction type must be Income or Expense.")]
    public string TransactionType { get; set; } = string.Empty;
}
