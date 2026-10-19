
using System.ComponentModel.DataAnnotations;

namespace BizBridge.Api.DTOs.Auth;

/// <summary>
/// Data required to register a new BizBridge user.
/// </summary>

public class RegisterDto
{
    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(12)]
    [StringLength(128)]
    public string Password { get; set; } = string.Empty;
}