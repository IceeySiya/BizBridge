namespace BizBridge.Api.Models;

public class BusinessEnquiry
{
    public int BusinessEnquiryID { get; set; }
    public int BusinessID { get; set; }
    public int? ExploreProductID { get; set; }
    public int CustomerUserID { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? BusinessResponse { get; set; }
    public DateTimeOffset? ResponseAt { get; set; }
    public string Status { get; set; } = "New";
    public DateTimeOffset CreatedAt { get; set; }
}
