using System.Security.Claims;
using BizBridge.Api.Data;
using BizBridge.Api.DTOs.Transactions;
using BizBridge.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BizBridge.Api.Controllers.Transactions;

[ApiController]
[Route("api/transactions")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly BizBridgeDbContext _context;

    public TransactionsController(BizBridgeDbContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var business = await GetOwnedBusinessAsync();
        if (business is null)
        {
            return NotFound(new { message = "Create a business profile first." });
        }

        var now = DateTimeOffset.UtcNow;
        var monthStart = new DateTimeOffset(
            now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var nextMonth = monthStart.AddMonths(1);

        var totals = await _context.Transactions
            .Where(transaction =>
                transaction.BusinessID == business.BusinessID &&
                transaction.TransactionDate >= monthStart &&
                transaction.TransactionDate < nextMonth)
            .GroupBy(transaction => transaction.Category.TransactionType)
            .Select(group => new
            {
                TransactionType = group.Key,
                Total = group.Sum(transaction => transaction.Amount)
            })
            .ToListAsync();

        var income = totals
            .Where(total => total.TransactionType == "Income")
            .Sum(total => total.Total);
        var expenses = totals
            .Where(total => total.TransactionType == "Expense")
            .Sum(total => total.Total);

        return Ok(new
        {
            periodStart = monthStart,
            periodEnd = nextMonth,
            income,
            expenses,
            netCashFlow = income - expenses
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] int limit = 10)
    {
        var business = await GetOwnedBusinessAsync();
        if (business is null)
        {
            return NotFound(new { message = "Create a business profile first." });
        }

        limit = Math.Clamp(limit, 1, 50);
        var transactions = await _context.Transactions
            .AsNoTracking()
            .Where(transaction =>
                transaction.BusinessID == business.BusinessID)
            .OrderByDescending(transaction => transaction.TransactionDate)
            .ThenByDescending(transaction => transaction.TransactionID)
            .Take(limit)
            .Select(transaction => new
            {
                transaction.TransactionID,
                transaction.TransactionDate,
                transaction.Amount,
                transaction.Description,
                transaction.PaymentReference,
                category = transaction.Category.Name,
                transactionType = transaction.Category.TransactionType
            })
            .ToListAsync();

        return Ok(transactions);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTransaction(
        [FromBody] CreateTransactionDto dto)
    {
        var business = await GetOwnedBusinessAsync();
        if (business is null)
        {
            return NotFound(new { message = "Create a business profile first." });
        }

        var categoryName = dto.Category.Trim();
        if (categoryName.Length < 2)
        {
            return BadRequest(new { message = "Category must contain at least 2 characters." });
        }

        var category = await _context.Categories
            .FirstOrDefaultAsync(item =>
                item.Name == categoryName &&
                item.TransactionType == dto.TransactionType);

        if (category is null)
        {
            category = new Category
            {
                Name = categoryName,
                TransactionType = dto.TransactionType,
                IsActive = true
            };
            _context.Categories.Add(category);
        }

        var paymentReference = string.IsNullOrWhiteSpace(dto.PaymentReference)
            ? null
            : dto.PaymentReference.Trim();

        var duplicateReference = paymentReference is not null &&
            await _context.Transactions.AnyAsync(transaction =>
                transaction.BusinessID == business.BusinessID &&
                transaction.PaymentReference != null &&
                transaction.PaymentReference.ToLower() ==
                    paymentReference.ToLower());

        var transaction = new Transaction
        {
            BusinessID = business.BusinessID,
            Category = category,
            Amount = dto.Amount,
            Description = string.IsNullOrWhiteSpace(dto.Description)
                ? null
                : dto.Description.Trim(),
            PaymentReference = paymentReference,
            TransactionDate = dto.TransactionDate ?? DateTimeOffset.UtcNow
        };
        _context.Transactions.Add(transaction);

        if (duplicateReference)
        {
            _context.PaymentAlerts.Add(new PaymentAlert
            {
                Transaction = transaction,
                AlertType = "Duplicate payment reference",
                Message = "This payment reference was already used by another transaction. Review the payment before relying on it. This alert does not confirm fraud.",
                Status = "Open",
                CreatedAt = DateTimeOffset.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        return Created("/api/transactions", new
        {
            transaction.TransactionID,
            transaction.TransactionDate,
            transaction.Amount,
            transaction.Description,
            transaction.PaymentReference,
            category = category.Name,
            transactionType = category.TransactionType,
            paymentReviewRequired = duplicateReference
        });
    }

    private async Task<BizBridge.Api.Models.Business?> GetOwnedBusinessAsync()
    {
        if (!int.TryParse(
                User.FindFirstValue(ClaimTypes.NameIdentifier),
                out var userId))
        {
            return null;
        }

        return await _context.Businesses
            .AsNoTracking()
            .FirstOrDefaultAsync(business => business.OwnerUserID == userId);
    }
}
