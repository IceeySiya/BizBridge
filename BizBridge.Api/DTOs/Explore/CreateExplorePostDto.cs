using System.ComponentModel.DataAnnotations;

namespace BizBridge.Api.DTOs.Explore;

public class CreateExplorePostDto
{
    [Required]
    [StringLength(2000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;

    [Url]
    [StringLength(2048)]
    public string? ImageUrl { get; set; }
}
