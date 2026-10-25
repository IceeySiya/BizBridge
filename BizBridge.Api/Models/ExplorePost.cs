namespace BizBridge.Api.Models;

public class ExplorePost
{
    public int ExplorePostID { get; set; }
    public int BusinessID { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
