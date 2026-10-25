namespace BizBridge.Api.Models;

public class ExploreSavedProduct
{
    public int UserID { get; set; }
    public int ExploreProductID { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
