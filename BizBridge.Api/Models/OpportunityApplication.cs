namespace BizBridge.Api.Models;

/// <summary>
/// Records a business's application for an opportunity.
/// </summary>

public class OpportunityApplication
{
    public int ApplicationID {get; set;}
    public int BusinessID {get; set;}
    public int OpportunityID {get;set;}
    // Allowed values: Submitted, UnderReview,
    // Accepted, Rejected, Withdrawn.
    public string Status { get; set; } = "Submitted";

      public DateTimeOffset AppliedAt { get; set; }

    // Navigation properties.
    public Business Business { get; set; } = null!;

    public Opportunity Opportunity { get; set; } = null!;
}