namespace BizBridge.Api.Models;

/// <summary>
/// Represents a registered BizBridge user.
/// A user can own businesses and may have permission
/// to manage procurement opportunities.
/// </summary>
public class User
{
    public int UserID {get; set;}
    public string FullName {get; set;}=string.Empty;
    public string Email {get; set;}=string.Empty;
    public string PasswordHash {get; set;}=string.Empty;
    public string Role {get; set;}="User";
} 