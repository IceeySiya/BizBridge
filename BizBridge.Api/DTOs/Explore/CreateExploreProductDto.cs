using System.ComponentModel.DataAnnotations;

namespace BizBridge.Api.DTOs.Explore;

public class CreateExploreProductDto
{
    [Required]
    [StringLength(150, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Category { get; set; } = string.Empty;

    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Range(0.01, 1000000000000)]
    public decimal Price { get; set; }

    [Url]
    [StringLength(2048)]
    public string? ImageUrl { get; set; }

    public bool IsAvailable { get; set; } = true;
}
