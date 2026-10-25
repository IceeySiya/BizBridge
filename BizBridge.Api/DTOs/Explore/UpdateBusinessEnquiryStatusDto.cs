using System.ComponentModel.DataAnnotations;

namespace BizBridge.Api.DTOs.Explore;

public class UpdateBusinessEnquiryStatusDto
{
    [Required]
    [RegularExpression("^(New|InProgress|Closed)$")]
    public string Status { get; set; } = "New";
}
