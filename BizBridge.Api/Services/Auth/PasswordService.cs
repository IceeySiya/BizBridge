
using Microsoft.AspNetCore.Identity;
using BizBridge.Api.Models;

namespace BizBridge.Api.Services.Auth;

/// <summary>
/// Securely hashes passwords and verifies login attempts.
/// </summary>
public class PasswordService
{
    private readonly PasswordHasher<User> _passwordHasher = new();

    /// <summary>
    /// Converts a plain-text password into a secure password hash.
    /// Store only the returned hash in the database.
    /// </summary>
    public string HashPassword(User user, string password)
    {
        return _passwordHasher.HashPassword(user, password);
    }

    /// <summary>
    /// Checks whether a submitted password matches the stored hash.
    /// </summary>
    public bool VerifyPassword(User user, string password)
    {
        var result = _passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            password);

        return result != PasswordVerificationResult.Failed;
    }
}
