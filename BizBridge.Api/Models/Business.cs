
namespace BizBridge.Api.Models;

/// <summary>
/// Represents a business registered on BizBridge.
/// Each business belongs to one user.
/// </summary>

public class Business
{
    public int BusinessID {get; set;}
    // Foreign key referencing Users.UserId
    public int OwnerUserID {get; set;}
    public string BusinessName {get; set;}=string.Empty;
    public string Industry {get; set;}=string.Empty;
    public string? Location {get; set;}
    public string? Description {get; set;}
    public DateTimeOffset Established {get;set;}
    //Navigation properties
    public User Owner { get; set; } = null!;
}