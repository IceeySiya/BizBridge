using System.Security.Claims;
using BizBridge.Api.Data;
using BizBridge.Api.DTOs.Explore;
using BizBridge.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BizBridge.Api.Controllers.Explore;

[ApiController]
[Route("api/explore")]
public class ExploreController : ControllerBase
{
    private readonly BizBridgeDbContext _context;

    public ExploreController(BizBridgeDbContext context)
    {
        _context = context;
    }

    [AllowAnonymous]
    [HttpGet("posts")]
    public async Task<IActionResult> GetPosts(
        [FromQuery] bool followingOnly = false,
        CancellationToken cancellationToken = default)
    {
        int? userId = GetUserId();

        if (followingOnly && userId is null)
        {
            return Unauthorized(new
            {
                message = "Sign in to view posts from businesses you follow."
            });
        }

        var query = from post in _context.ExplorePosts.AsNoTracking()
                    join business in _context.Businesses.AsNoTracking()
                        on post.BusinessID equals business.BusinessID
                    where business.IsVisibleOnExplore
                    select new { post, business };

        if (followingOnly && userId.HasValue)
        {
            var authenticatedUserId = userId.Value;
            query = query.Where(item => _context.BusinessFollows.Any(
                follow => follow.UserID == authenticatedUserId &&
                    follow.BusinessID == item.business.BusinessID));
        }

        var posts = await query
            .OrderByDescending(item => item.post.CreatedAt)
            .Take(100)
            .Select(item => new
            {
                item.post.ExplorePostID,
                item.post.BusinessID,
                item.post.Content,
                item.post.ImageUrl,
                item.post.CreatedAt,
                BusinessName = item.business.BusinessName,
                item.business.Industry,
                item.business.Location,
                BusinessImageUrl = item.business.ImageUrl,
                LikeCount = _context.ExplorePostLikes.Count(
                    like => like.ExplorePostID == item.post.ExplorePostID),
                IsLiked = userId.HasValue &&
                    _context.ExplorePostLikes.Any(like =>
                        like.UserID == userId.Value &&
                        like.ExplorePostID == item.post.ExplorePostID),
                IsSaved = userId.HasValue &&
                    _context.ExploreSavedPosts.Any(saved =>
                        saved.UserID == userId.Value &&
                        saved.ExplorePostID == item.post.ExplorePostID)
            })
            .ToListAsync(cancellationToken);

        return Ok(posts);
    }

    [Authorize]
    [HttpPost("posts")]
    public async Task<IActionResult> CreatePost(
        [FromBody] CreateExplorePostDto dto,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            return BadRequest(new { message = "Post content cannot be empty." });
        }

        var business = await GetOwnedBusinessAsync(cancellationToken);
        if (business is null)
        {
            return Conflict(new
            {
                message = "Create a business profile before publishing a post."
            });
        }

        var post = new ExplorePost
        {
            BusinessID = business.BusinessID,
            Content = dto.Content.Trim(),
            ImageUrl = dto.ImageUrl?.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };

        _context.ExplorePosts.Add(post);
        await _context.SaveChangesAsync(cancellationToken);

        return Created(
            $"/api/explore/posts/{post.ExplorePostID}",
            new
            {
                post.ExplorePostID,
                post.BusinessID,
                post.Content,
                post.ImageUrl,
                post.CreatedAt,
                BusinessName = business.BusinessName,
                business.Industry,
                business.Location,
                BusinessImageUrl = business.ImageUrl,
                LikeCount = 0,
                IsLiked = false,
                IsSaved = false
            });
    }

    [Authorize]
    [HttpDelete("posts/{postId:int}")]
    public async Task<IActionResult> DeletePost(
        int postId,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var post = await (
            from item in _context.ExplorePosts
            join business in _context.Businesses
                on item.BusinessID equals business.BusinessID
            where item.ExplorePostID == postId &&
                business.OwnerUserID == userId.Value
            select item
        ).FirstOrDefaultAsync(cancellationToken);

        if (post is null)
        {
            return NotFound(new { message = "Post not found." });
        }

        _context.ExplorePosts.Remove(post);
        await _context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [AllowAnonymous]
    [HttpGet("products")]
    public async Task<IActionResult> GetProducts(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var products = await (
            from product in _context.ExploreProducts.AsNoTracking()
            join business in _context.Businesses.AsNoTracking()
                on product.BusinessID equals business.BusinessID
            where business.IsVisibleOnExplore && product.IsAvailable
            orderby product.CreatedAt descending
            select new
            {
                product.ExploreProductID,
                product.BusinessID,
                product.Name,
                product.Category,
                product.Description,
                product.Price,
                product.ImageUrl,
                product.CreatedAt,
                BusinessName = business.BusinessName,
                business.Industry,
                business.Location,
                BusinessImageUrl = business.ImageUrl,
                IsSaved = userId.HasValue &&
                    _context.ExploreSavedProducts.Any(saved =>
                        saved.UserID == userId.Value &&
                        saved.ExploreProductID == product.ExploreProductID)
            })
            .Take(100)
            .ToListAsync(cancellationToken);

        return Ok(products);
    }

    [Authorize]
    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct(
        [FromBody] CreateExploreProductDto dto,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) ||
            string.IsNullOrWhiteSpace(dto.Category))
        {
            return BadRequest(new
            {
                message = "Product name and category are required."
            });
        }

        var business = await GetOwnedBusinessAsync(cancellationToken);
        if (business is null)
        {
            return Conflict(new
            {
                message = "Create a business profile before listing a product."
            });
        }

        var product = new ExploreProduct
        {
            BusinessID = business.BusinessID,
            Name = dto.Name.Trim(),
            Category = dto.Category.Trim(),
            Description = dto.Description.Trim(),
            Price = dto.Price,
            ImageUrl = dto.ImageUrl?.Trim(),
            IsAvailable = dto.IsAvailable,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _context.ExploreProducts.Add(product);
        await _context.SaveChangesAsync(cancellationToken);

        return Created(
            $"/api/explore/products/{product.ExploreProductID}",
            new
            {
                product.ExploreProductID,
                product.BusinessID,
                product.Name,
                product.Category,
                product.Description,
                product.Price,
                product.ImageUrl,
                product.CreatedAt,
                BusinessName = business.BusinessName,
                business.Industry,
                business.Location,
                BusinessImageUrl = business.ImageUrl,
                IsSaved = false
            });
    }

    [Authorize]
    [HttpPut("products/{productId:int}")]
    public async Task<IActionResult> UpdateProduct(
        int productId,
        [FromBody] CreateExploreProductDto dto,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) ||
            string.IsNullOrWhiteSpace(dto.Category))
        {
            return BadRequest(new
            {
                message = "Product name and category are required."
            });
        }

        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var product = await (
            from item in _context.ExploreProducts
            join business in _context.Businesses
                on item.BusinessID equals business.BusinessID
            where item.ExploreProductID == productId &&
                business.OwnerUserID == userId.Value
            select item
        ).FirstOrDefaultAsync(cancellationToken);

        if (product is null)
        {
            return NotFound(new { message = "Product not found." });
        }

        product.Name = dto.Name.Trim();
        product.Category = dto.Category.Trim();
        product.Description = dto.Description.Trim();
        product.Price = dto.Price;
        product.ImageUrl = dto.ImageUrl?.Trim();
        product.IsAvailable = dto.IsAvailable;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            product.ExploreProductID,
            product.BusinessID,
            product.Name,
            product.Category,
            product.Description,
            product.Price,
            product.ImageUrl,
            product.IsAvailable,
            product.CreatedAt
        });
    }

    [Authorize]
    [HttpDelete("products/{productId:int}")]
    public async Task<IActionResult> DeleteProduct(
        int productId,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var product = await (
            from item in _context.ExploreProducts
            join business in _context.Businesses
                on item.BusinessID equals business.BusinessID
            where item.ExploreProductID == productId &&
                business.OwnerUserID == userId.Value
            select item
        ).FirstOrDefaultAsync(cancellationToken);

        if (product is null)
        {
            return NotFound(new { message = "Product not found." });
        }

        _context.ExploreProducts.Remove(product);
        await _context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [Authorize]
    [HttpGet("following")]
    public async Task<IActionResult> GetFollowing(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var businesses = await (
            from follow in _context.BusinessFollows.AsNoTracking()
            join business in _context.Businesses.AsNoTracking()
                on follow.BusinessID equals business.BusinessID
            where follow.UserID == userId.Value &&
                business.IsVisibleOnExplore
            orderby business.BusinessName
            select new
            {
                business.BusinessID,
                business.BusinessName,
                business.Industry,
                business.ImageUrl,
                follow.CreatedAt
            }
        ).ToListAsync(cancellationToken);

        return Ok(businesses);
    }

    [Authorize]
    [HttpPut("businesses/{businessId:int}/follow")]
    public Task<IActionResult> SetFollow(
        int businessId,
        [FromBody] SetExploreStateDto dto,
        CancellationToken cancellationToken)
    {
        return SetBusinessRelationAsync(
            businessId, dto.IsActive, follow: true, cancellationToken);
    }

    [Authorize]
    [HttpPut("businesses/{businessId:int}/save")]
    public Task<IActionResult> SetSavedBusiness(
        int businessId,
        [FromBody] SetExploreStateDto dto,
        CancellationToken cancellationToken)
    {
        return SetBusinessRelationAsync(
            businessId, dto.IsActive, follow: false, cancellationToken);
    }

    [Authorize]
    [HttpPut("posts/{postId:int}/like")]
    public Task<IActionResult> SetPostLike(
        int postId,
        [FromBody] SetExploreStateDto dto,
        CancellationToken cancellationToken)
    {
        return SetPostRelationAsync(
            postId, dto.IsActive, like: true, cancellationToken);
    }

    [Authorize]
    [HttpPut("posts/{postId:int}/save")]
    public Task<IActionResult> SetSavedPost(
        int postId,
        [FromBody] SetExploreStateDto dto,
        CancellationToken cancellationToken)
    {
        return SetPostRelationAsync(
            postId, dto.IsActive, like: false, cancellationToken);
    }

    [Authorize]
    [HttpPut("products/{productId:int}/save")]
    public async Task<IActionResult> SetSavedProduct(
        int productId,
        [FromBody] SetExploreStateDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var exists = await _context.ExploreProducts.AnyAsync(
            product => product.ExploreProductID == productId &&
                product.IsAvailable &&
                _context.Businesses.Any(business =>
                    business.BusinessID == product.BusinessID &&
                    business.IsVisibleOnExplore),
            cancellationToken);

        if (!exists)
        {
            return NotFound(new { message = "Product not found." });
        }

        var saved = await _context.ExploreSavedProducts.FindAsync(
            [userId.Value, productId], cancellationToken);

        if (dto.IsActive && saved is null)
        {
            _context.ExploreSavedProducts.Add(new ExploreSavedProduct
            {
                UserID = userId.Value,
                ExploreProductID = productId,
                CreatedAt = DateTimeOffset.UtcNow
            });
        }
        else if (!dto.IsActive && saved is not null)
        {
            _context.ExploreSavedProducts.Remove(saved);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(new { productId, dto.IsActive });
    }

    [Authorize]
    [HttpGet("saved")]
    public async Task<IActionResult> GetSaved(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var businesses = await _context.ExploreSavedBusinesses
            .Where(saved => saved.UserID == userId.Value)
            .Select(saved => saved.BusinessID)
            .ToListAsync(cancellationToken);
        var posts = await _context.ExploreSavedPosts
            .Where(saved => saved.UserID == userId.Value)
            .Select(saved => saved.ExplorePostID)
            .ToListAsync(cancellationToken);
        var products = await _context.ExploreSavedProducts
            .Where(saved => saved.UserID == userId.Value)
            .Select(saved => saved.ExploreProductID)
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            businessIDs = businesses,
            postIDs = posts,
            productIDs = products
        });
    }

    [Authorize]
    [HttpPost("enquiries")]
    public async Task<IActionResult> CreateEnquiry(
        [FromBody] CreateBusinessEnquiryDto dto,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Message))
        {
            return BadRequest(new { message = "Enquiry message cannot be empty." });
        }

        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var businessId = await _context.Businesses
            .Where(business =>
                business.BusinessID == dto.BusinessID &&
                business.IsVisibleOnExplore &&
                business.OwnerUserID != userId.Value)
            .Where(business =>
                dto.ExploreProductID == null ||
                _context.ExploreProducts.Any(product =>
                    product.ExploreProductID == dto.ExploreProductID &&
                    product.BusinessID == business.BusinessID &&
                    product.IsAvailable))
            .Select(business => (int?)business.BusinessID)
            .FirstOrDefaultAsync(cancellationToken);

        if (businessId is null)
        {
            return NotFound(new
            {
                message = "The selected public business or product is unavailable."
            });
        }

        var enquiry = new BusinessEnquiry
        {
            BusinessID = businessId.Value,
            ExploreProductID = dto.ExploreProductID,
            CustomerUserID = userId.Value,
            Message = dto.Message.Trim(),
            Status = "New",
            CreatedAt = DateTimeOffset.UtcNow
        };

        _context.BusinessEnquiries.Add(enquiry);
        await _context.SaveChangesAsync(cancellationToken);

        return Created(
            $"/api/explore/enquiries/{enquiry.BusinessEnquiryID}",
            new
            {
                enquiry.BusinessEnquiryID,
                enquiry.BusinessID,
                enquiry.ExploreProductID,
                enquiry.Message,
                enquiry.Status,
                enquiry.CreatedAt
            });
    }

    [Authorize]
    [HttpGet("enquiries/sent")]
    public async Task<IActionResult> GetSentEnquiries(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var enquiries = await (
            from enquiry in _context.BusinessEnquiries.AsNoTracking()
            join business in _context.Businesses.AsNoTracking()
                on enquiry.BusinessID equals business.BusinessID
            join product in _context.ExploreProducts.AsNoTracking()
                on enquiry.ExploreProductID equals product.ExploreProductID
                into products
            from product in products.DefaultIfEmpty()
            where enquiry.CustomerUserID == userId.Value
            orderby enquiry.CreatedAt descending
            select new
            {
                enquiry.BusinessEnquiryID,
                enquiry.BusinessID,
                BusinessName = business.BusinessName,
                ProductName = product == null ? null : product.Name,
                enquiry.Message,
                enquiry.BusinessResponse,
                enquiry.ResponseAt,
                enquiry.Status,
                enquiry.CreatedAt
            }
        ).ToListAsync(cancellationToken);

        return Ok(enquiries);
    }

    [Authorize]
    [HttpGet("enquiries/received")]
    public async Task<IActionResult> GetReceivedEnquiries(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var enquiries = await (
            from enquiry in _context.BusinessEnquiries.AsNoTracking()
            join business in _context.Businesses.AsNoTracking()
                on enquiry.BusinessID equals business.BusinessID
            join customer in _context.Users.AsNoTracking()
                on enquiry.CustomerUserID equals customer.UserID
            join product in _context.ExploreProducts.AsNoTracking()
                on enquiry.ExploreProductID equals product.ExploreProductID
                into products
            from product in products.DefaultIfEmpty()
            where business.OwnerUserID == userId.Value
            orderby enquiry.CreatedAt descending
            select new
            {
                enquiry.BusinessEnquiryID,
                enquiry.BusinessID,
                BusinessName = business.BusinessName,
                CustomerName = customer.FullName,
                ProductName = product == null ? null : product.Name,
                enquiry.Message,
                enquiry.BusinessResponse,
                enquiry.ResponseAt,
                enquiry.Status,
                enquiry.CreatedAt
            }
        ).ToListAsync(cancellationToken);

        return Ok(enquiries);
    }

    [Authorize]
    [HttpPut("enquiries/{enquiryId:int}/status")]
    public async Task<IActionResult> UpdateEnquiryStatus(
        int enquiryId,
        [FromBody] UpdateBusinessEnquiryStatusDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var enquiry = await (
            from item in _context.BusinessEnquiries
            join business in _context.Businesses
                on item.BusinessID equals business.BusinessID
            where item.BusinessEnquiryID == enquiryId &&
                business.OwnerUserID == userId.Value
            select item
        ).FirstOrDefaultAsync(cancellationToken);

        if (enquiry is null)
        {
            return NotFound(new { message = "Enquiry not found." });
        }

        enquiry.Status = dto.Status;
        await _context.SaveChangesAsync(cancellationToken);
        return Ok(new { enquiry.BusinessEnquiryID, enquiry.Status });
    }

    [Authorize]
    [HttpPut("enquiries/{enquiryId:int}/response")]
    public async Task<IActionResult> RespondToEnquiry(
        int enquiryId,
        [FromBody] RespondToBusinessEnquiryDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var enquiry = await (
            from item in _context.BusinessEnquiries
            join business in _context.Businesses
                on item.BusinessID equals business.BusinessID
            where item.BusinessEnquiryID == enquiryId &&
                business.OwnerUserID == userId.Value
            select item
        ).FirstOrDefaultAsync(cancellationToken);

        if (enquiry is null)
        {
            return NotFound(new { message = "Enquiry not found." });
        }

        if (enquiry.Status == "Closed")
        {
            return Conflict(new
            {
                message = "Reopen this enquiry before sending a response."
            });
        }

        enquiry.BusinessResponse = dto.Message.Trim();
        enquiry.ResponseAt = DateTimeOffset.UtcNow;
        enquiry.Status = "InProgress";
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            enquiry.BusinessEnquiryID,
            enquiry.BusinessResponse,
            enquiry.ResponseAt,
            enquiry.Status
        });
    }

    private async Task<IActionResult> SetBusinessRelationAsync(
        int businessId,
        bool isActive,
        bool follow,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var business = await _context.Businesses
            .AsNoTracking()
            .FirstOrDefaultAsync(item =>
                item.BusinessID == businessId &&
                item.IsVisibleOnExplore &&
                item.OwnerUserID != userId.Value,
                cancellationToken);

        if (business is null)
        {
            return NotFound(new { message = "Business not found." });
        }

        if (follow)
        {
            var relation = await _context.BusinessFollows.FindAsync(
                [userId.Value, businessId], cancellationToken);
            if (isActive && relation is null)
            {
                _context.BusinessFollows.Add(new BusinessFollow
                {
                    UserID = userId.Value,
                    BusinessID = businessId,
                    CreatedAt = DateTimeOffset.UtcNow
                });
            }
            else if (!isActive && relation is not null)
            {
                _context.BusinessFollows.Remove(relation);
            }
        }
        else
        {
            var relation = await _context.ExploreSavedBusinesses.FindAsync(
                [userId.Value, businessId], cancellationToken);
            if (isActive && relation is null)
            {
                _context.ExploreSavedBusinesses.Add(
                    new ExploreSavedBusiness
                    {
                        UserID = userId.Value,
                        BusinessID = businessId,
                        CreatedAt = DateTimeOffset.UtcNow
                    });
            }
            else if (!isActive && relation is not null)
            {
                _context.ExploreSavedBusinesses.Remove(relation);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(new { businessId, isActive });
    }

    private async Task<IActionResult> SetPostRelationAsync(
        int postId,
        bool isActive,
        bool like,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var isPublic = await (
            from post in _context.ExplorePosts.AsNoTracking()
            join business in _context.Businesses.AsNoTracking()
                on post.BusinessID equals business.BusinessID
            where post.ExplorePostID == postId &&
                business.IsVisibleOnExplore
            select post.ExplorePostID
        ).AnyAsync(cancellationToken);

        if (!isPublic)
        {
            return NotFound(new { message = "Post not found." });
        }

        if (like)
        {
            var relation = await _context.ExplorePostLikes.FindAsync(
                [userId.Value, postId], cancellationToken);
            if (isActive && relation is null)
            {
                _context.ExplorePostLikes.Add(new ExplorePostLike
                {
                    UserID = userId.Value,
                    ExplorePostID = postId,
                    CreatedAt = DateTimeOffset.UtcNow
                });
            }
            else if (!isActive && relation is not null)
            {
                _context.ExplorePostLikes.Remove(relation);
            }
        }
        else
        {
            var relation = await _context.ExploreSavedPosts.FindAsync(
                [userId.Value, postId], cancellationToken);
            if (isActive && relation is null)
            {
                _context.ExploreSavedPosts.Add(new ExploreSavedPost
                {
                    UserID = userId.Value,
                    ExplorePostID = postId,
                    CreatedAt = DateTimeOffset.UtcNow
                });
            }
            else if (!isActive && relation is not null)
            {
                _context.ExploreSavedPosts.Remove(relation);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(new { postId, isActive });
    }

    private Task<BizBridge.Api.Models.Business?> GetOwnedBusinessAsync(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        return userId.HasValue
            ? _context.Businesses.FirstOrDefaultAsync(
                business => business.OwnerUserID == userId.Value,
                cancellationToken)
            : Task.FromResult<BizBridge.Api.Models.Business?>(null);
    }

    private int? GetUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(value, out var userId) ? userId : null;
    }
}
