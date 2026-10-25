
using System.Security.Claims;
using BizBridge.Api.DTOs.Transactions;
using BizBridge.Api.Services.Transactions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizBridge.Api.Controllers.Transactions;

/// <summary>
/// Handles HTTP requests for business transactions.
/// Business rules and database operations belong to TransactionService.
/// </summary>
[ApiController]
[Authorize]
[Route("api/businesses/{businessId:int}/transactions")]
public class TransactionsController : ControllerBase
{
    private readonly TransactionService _transactionService;

    public TransactionsController(TransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    /// <summary>
    /// Records an income or expense transaction.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateTransaction(
        int businessId,
        [FromBody] CreateTransactionDto dto)
    {
        int? userId = GetAuthenticatedUserId();

        if (userId == null)
        {
            return Unauthorized(new
            {
                message = "Unable to identify the authenticated user."
            });
        }

        var result = await _transactionService.CreateTransactionAsync(
            businessId,
            userId.Value,
            dto);

        if (result.Error != null)
        {
            if (result.Error == "Business not found or access denied.")
            {
                return NotFound(new { message = result.Error });
            }

            return BadRequest(new { message = result.Error });
        }

        var transaction = result.Transaction!;

        return Created(
            $"/api/businesses/{businessId}/transactions",
            new
            {
                message = "Transaction recorded successfully.",
                transaction = new
                {
                    transaction.TransactionID,
                    transaction.BusinessID,
                    transaction.CategoryID,
                    CategoryName = transaction.Category.Name,
                    transaction.Category.TransactionType,
                    transaction.Amount,
                    transaction.Description,
                    transaction.PaymentReference,
                    transaction.TransactionDate
                }
            });
    }

    /// <summary>
    /// Retrieves the transaction history for a business.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetTransactions(int businessId)
    {
        int? userId = GetAuthenticatedUserId();

        if (userId == null)
        {
            return Unauthorized(new
            {
                message = "Unable to identify the authenticated user."
            });
        }

        var result = await _transactionService.GetTransactionsAsync(
            businessId,
            userId.Value);

        if (!result.BusinessFound)
        {
            return NotFound(new
            {
                message = "Business not found or access denied."
            });
        }

        var transactions = result.Transactions.Select(t => new
        {
            t.TransactionID,
            t.BusinessID,
            t.CategoryID,
            CategoryName = t.Category.Name,
            t.Category.TransactionType,
            t.Amount,
            t.Description,
            t.PaymentReference,
            t.TransactionDate
        });

        return Ok(transactions);
    }

    
/// <summary>
/// Deletes a transaction belonging to the authenticated user's business.
/// </summary>
[HttpDelete("{transactionId:int}")]
public async Task<IActionResult> DeleteTransaction(
    int businessId,
    int transactionId)
{
    int? userId = GetAuthenticatedUserId();

    if (userId == null)
    {
        return Unauthorized(new
        {
            message = "Unable to identify the authenticated user."
        });
    }

    bool deleted = await _transactionService.DeleteTransactionAsync(
        businessId,
        transactionId,
        userId.Value);

    if (!deleted)
    {
        return NotFound(new
        {
            message = "Transaction or business not found, or access denied."
        });
    }

    return NoContent();
}


    /// <summary>
    /// Extracts the authenticated user's ID from their JWT claims.
    /// </summary>
    private int? GetAuthenticatedUserId()
    {
        string? userIdClaim =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        return int.TryParse(userIdClaim, out int userId)
            ? userId
            : null;
    }
}
