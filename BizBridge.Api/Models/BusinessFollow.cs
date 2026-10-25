namespace BizBridge.Api.Models;

public class BusinessFollow
{
    public int UserID { get; set; }
    public int BusinessID { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
