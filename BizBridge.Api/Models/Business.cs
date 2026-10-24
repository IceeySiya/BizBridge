
namespace BizBridge.Api.Models;

/// <summary>
/// Represents a business registered on BizBridge.
/// Each business belongs to one user.
/// </summary>
public class Business
{
    public int BusinessID { get; set; }

    // Foreign key referencing Users.UserId
    public int OwnerUserID { get; set; }

    // Basic business information
    public string BusinessName { get; set; } = string.Empty;
    public string Industry { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? Description { get; set; }
    public DateTimeOffset Established { get; set; }

    // Business contact details
    public string? BusinessEmail { get; set; }
    public string? BusinessPhone { get; set; }
    public string? WebsiteUrl { get; set; }

    // URL for the business logo or profile picture
    public string? ImageUrl { get; set; }

    // Initial funds available when the business starts tracking
    // its finances on BizBridge.
    public decimal OpeningBalance { get; set; } = 0m;

    // Navigation properties
    public User Owner { get; set; } = null!;
}
