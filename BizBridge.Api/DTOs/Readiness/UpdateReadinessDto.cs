using System.ComponentModel.DataAnnotations;

namespace BizBridge.Api.DTOs.Readiness;

public sealed class UpdateReadinessDto
{
    [Required]
    public bool IsCompleted { get; init; }
}
