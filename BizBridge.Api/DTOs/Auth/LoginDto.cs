
using System.ComponentModel.DataAnnotations;

namespace BizBridge.Api.DTOs.Auth;

/// <summary>
/// Credentials required to log in to BizBridge.
/// </summary>
public class LoginDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
