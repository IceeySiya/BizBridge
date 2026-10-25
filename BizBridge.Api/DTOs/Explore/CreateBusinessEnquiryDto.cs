using System.ComponentModel.DataAnnotations;

namespace BizBridge.Api.DTOs.Explore;

public class CreateBusinessEnquiryDto
{
    [Range(1, int.MaxValue)]
    public int BusinessID { get; set; }

    [Required]
    [StringLength(2000, MinimumLength = 5)]
    public string Message { get; set; } = string.Empty;

    public int? ExploreProductID { get; set; }
}
