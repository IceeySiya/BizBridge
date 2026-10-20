
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

    [StringLength(2000)]
    public string? Description { get; set; }

    public DateTimeOffset? Established { get; set; }
}
