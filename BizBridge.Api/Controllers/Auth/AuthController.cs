
using BizBridge.Api.Data;
using BizBridge.Api.DTOs.Auth;
using BizBridge.Api.Models;
using BizBridge.Api.Services.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
namespace BizBridge.Api.Controllers.Auth;

/// <summary>
/// Handles user registration and login for BizBridge.
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly BizBridgeDbContext _context;
    private readonly PasswordService _passwordService;
    private readonly JwtService _jwtService;

    public AuthController(
        BizBridgeDbContext context,
        PasswordService passwordService,
        JwtService jwtService)
    {
        _context = context;
        _passwordService = passwordService;
        _jwtService = jwtService;
    }

    /// <summary>
    /// Registers a new BizBridge user.
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();

        var emailExists = await _context.Users
            .AnyAsync(user => user.Email == email);

        if (emailExists)
        {
            return Conflict(new
            {
                message = "An account with this email already exists."
            });
        }

        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = email,
            Role = "User"
        };

        user.PasswordHash = _passwordService.HashPassword(
            user,
            dto.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Created("/api/auth/register", new
        {
            message = "Account registered successfully.",
            user = new
            {
                user.UserID,
                user.FullName,
                user.Email,
                user.Role
            }
        });
    }

    /// <summary>
    /// Authenticates a user and returns a JWT access token.
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();

        var user = await _context.Users
            .SingleOrDefaultAsync(user => user.Email == email);

        if (user is null ||
            !_passwordService.VerifyPassword(user, dto.Password))
        {
            return Unauthorized(new
            {
                message = "Invalid email or password."
            });
        }

        var token = _jwtService.GenerateToken(user);

        return Ok(new
        {
            message = "Login successful.",
            accessToken = token,
            tokenType = "Bearer",
            expiresInMinutes = 60,
            user = new
            {
                user.UserID,
                user.FullName,
                user.Email,
                user.Role
            }
        });
    }


/// <summary>
/// Returns the identity claims of the authenticated user.
/// </summary>
[Authorize]
[HttpGet("me")]
public IActionResult Me()
{
    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    var fullName = User.Identity?.Name;
    var email = User.FindFirstValue(ClaimTypes.Email);
    var role = User.FindFirstValue(ClaimTypes.Role);

    return Ok(new
    {
        userID = userId,
        fullName,
        email,
        role
    });
}

}
