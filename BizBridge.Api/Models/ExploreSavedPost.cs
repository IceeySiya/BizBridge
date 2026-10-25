namespace BizBridge.Api.Models;

public class ExploreSavedPost
{
    public int UserID { get; set; }
    public int ExplorePostID { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
