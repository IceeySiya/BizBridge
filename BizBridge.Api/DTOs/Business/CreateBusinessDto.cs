
using System.ComponentModel.DataAnnotations;

namespace BizBridge.Api.DTOs.Business;

/// <summary>
/// Data required to create a BizBridge business profile.
/// The owner is determined from the authenticated user.
/// </summary>
public class CreateBusinessDto
{
    [Required]
    [StringLength(150, MinimumLength = 2)]
    public string BusinessName { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Industry { get; set; } = string.Empty;

    [StringLength(150)]
    public string? Location { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }

    public DateTimeOffset? Established { get; set; }

    [Range(typeof(decimal), "0", "9999999999999999")]
    public decimal OpeningBalance { get; set; } = 0m;

    [EmailAddress]
    [StringLength(254)]
    public string? BusinessEmail { get; set; }

    [Phone]
    [StringLength(30)]
    public string? BusinessPhone { get; set; }

    [Url]
    [StringLength(2048)]
    public string? WebsiteUrl { get; set; }

    [Url]
    [StringLength(2048)]
    public string? ImageUrl { get; set; }
}
