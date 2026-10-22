using BizBridge.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BizBridge.Api.Controllers.Opportunities;

[ApiController]
[Route("api/opportunities")]
[Authorize]
public class OpportunitiesController : ControllerBase
{
    private readonly BizBridgeDbContext _context;

    public OpportunitiesController(BizBridgeDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetPublishedOpportunities()
    {
        var now = DateTimeOffset.UtcNow;
        var opportunities = await _context.Opportunities
            .AsNoTracking()
            .Where(opportunity => opportunity.Status == "Published")
            .Select(opportunity => new
            {
                opportunity.OpportunityID,
                opportunity.Title,
                opportunity.Organisation,
                opportunity.Description,
                opportunity.Requirements,
                opportunity.Deadline,
                opportunity.SourceUrl
            })
            .ToListAsync();

        return Ok(opportunities
            .Where(opportunity => opportunity.Deadline >= now)
            .OrderBy(opportunity => opportunity.Deadline));
    }
}
