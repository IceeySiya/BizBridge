using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace BizBridge.Api.Tests;

public sealed class AuthFlowTests : ApiTestBase
{
    [Fact]
    public async Task Registration_and_login_create_an_authenticated_session()
    {
        var email = $"thandi-{Guid.NewGuid():N}@example.test";
        const string fullName = "Thandi Mokoena";
        const string password = "BizBridge-Test-Password-2026";

        using var registerResponse = await Client.PostAsJsonAsync(
            "/api/auth/register",
            new { fullName, email = $" {email.ToUpperInvariant()} ", password });

        Assert.Equal(HttpStatusCode.Created, registerResponse.StatusCode);

        using var loginResponse = await Client.PostAsJsonAsync(
            "/api/auth/login",
            new { email, password });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        using var loginJson = await JsonDocument.ParseAsync(
            await loginResponse.Content.ReadAsStreamAsync());
        var token = loginJson.RootElement
            .GetProperty("accessToken")
            .GetString();
        Assert.False(string.IsNullOrWhiteSpace(token));

        using var meRequest = CreateAuthorizedRequest(
            HttpMethod.Get,
            "/api/auth/me",
            token!);
        using var meResponse = await Client.SendAsync(meRequest);

        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);
        using var meJson = await JsonDocument.ParseAsync(
            await meResponse.Content.ReadAsStreamAsync());
        Assert.Equal(
            fullName,
            meJson.RootElement.GetProperty("fullName").GetString());
        Assert.Equal(
            email.ToLowerInvariant(),
            meJson.RootElement.GetProperty("email").GetString());
    }

    [Fact]
    public async Task Registration_rejects_a_duplicate_email()
    {
        var email = $"founder-{Guid.NewGuid():N}@example.test";
        const string password = "BizBridge-Test-Password-2026";

        using var firstResponse = await Client.PostAsJsonAsync(
            "/api/auth/register",
            new { fullName = "First Founder", email, password });
        using var duplicateResponse = await Client.PostAsJsonAsync(
            "/api/auth/register",
            new { fullName = "Second Founder", email = email.ToUpperInvariant(), password });

        Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, duplicateResponse.StatusCode);
    }

    [Fact]
    public async Task Login_rejects_invalid_credentials()
    {
        var email = $"unknown-{Guid.NewGuid():N}@example.test";

        using var response = await Client.PostAsJsonAsync(
            "/api/auth/login",
            new { email, password = "Wrong-Password-2026" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Identity_endpoint_requires_a_valid_token()
    {
        using var response = await Client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
