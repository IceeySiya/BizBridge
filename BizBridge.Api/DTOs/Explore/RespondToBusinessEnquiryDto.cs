using System.ComponentModel.DataAnnotations;

namespace BizBridge.Api.DTOs.Explore;

public class RespondToBusinessEnquiryDto
{
    [Required]
    [StringLength(2000, MinimumLength = 5)]
    public string Message { get; set; } = string.Empty;
}
