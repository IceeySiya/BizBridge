namespace BizBridge.Api.Models;

/// <summary>
/// Represents a procurement or business-growth opportunity
/// published for businesses to discover.
/// </summary>
/// 
public class Opportunity
{
    public int OpportunityID {get; set;}
    public int ManagedByUserID {get; set;}
    public string Title { get; set; } = string.Empty;

    public string Organisation { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string? Requirements { get; set; }
    public DateTimeOffset Deadline { get; set; }

    public string? SourceUrl { get; set; }
    // Allowed values: Draft, Published, Closed.
    public string Status { get; set; } = "Draft";
    public DateTimeOffset CreatedAt { get; set; }

    // Navigation property for the user managing it.
    public User ManagedByUser { get; set; } = null!;
}