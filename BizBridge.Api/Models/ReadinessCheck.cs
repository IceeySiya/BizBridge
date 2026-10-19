
namespace BizBridge.Api.Models;

/// <summary>
/// Defines a business-readiness checklist item
/// that businesses can work toward completing.
/// </summary>

public class ReadinessCheck
{
    public int CheckID {get; set;}
    public string Title {get; set;}=string.Empty;
    public string? Description { get; set; }

    public bool IsRequired { get; set; } = true;
}