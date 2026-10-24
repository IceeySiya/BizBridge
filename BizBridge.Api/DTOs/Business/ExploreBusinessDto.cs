
namespace BizBridge.Api.DTOs.Business;

public class ExploreBusinessDto
{
    public int BusinessID { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public string Industry { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? Description { get; set; }
    public string? BusinessEmail { get; set; }
    public string? BusinessPhone { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? ImageUrl { get; set; }
}
