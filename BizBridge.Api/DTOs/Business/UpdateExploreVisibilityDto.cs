
using System.ComponentModel.DataAnnotations;

namespace BizBridge.Api.DTOs.Business;

public class UpdateExploreVisibilityDto
{
    [Required]
    public bool? IsVisibleOnExplore { get; set; }
}
