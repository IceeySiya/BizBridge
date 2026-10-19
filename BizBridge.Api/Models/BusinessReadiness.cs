
namespace BizBridge.Api.Models;

/// <summary>
/// Tracks a business's progress on an individual
/// readiness checklist item.
/// </summary>
public class BusinessReadiness
{
    public int BusinessReadinessID {get; set;}
    public int BusinessID { get; set; }
    public int CheckID {get; set;}
    public bool IsCompleted { get; set; }

    public DateTimeOffset? CompletedAt { get; set; }

    // Navigation properties.
    public Business Business { get; set; } = null!;

    public ReadinessCheck Check { get; set; } = null!;
}