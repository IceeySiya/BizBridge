using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace BizBridge.Api.Tests;

public sealed class BusinessAuthorizationTests : ApiTestBase
{
    [Fact]
    public async Task Business_profiles_are_private_to_their_owners()
    {
        var ownerToken = await RegisterAndLoginAsync();
        using var createResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            "/api/businesses",
            ownerToken,
            new
            {
                businessName = "Owner's Catering",
                industry = "Food Services"
            });
        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);

        var otherFounderToken = await RegisterAndLoginAsync(
            fullName: "Another Founder");
        using var otherFoundersRead = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/businesses/mine",
            otherFounderToken);
        using var otherFoundersUpdate = await SendAuthorizedJsonAsync(
            HttpMethod.Put,
            "/api/businesses/mine",
            otherFounderToken,
            new
            {
                businessName = "Unauthorized Change",
                industry = "Retail"
            });

        Assert.Equal(HttpStatusCode.NotFound, otherFoundersRead.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, otherFoundersUpdate.StatusCode);

        using var ownersRead = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/businesses/mine",
            ownerToken);
        Assert.Equal(HttpStatusCode.OK, ownersRead.StatusCode);
    }

    [Fact]
    public async Task Business_endpoints_require_authentication()
    {
        using var getResponse = await Client.GetAsync("/api/businesses/mine");
        using var createResponse = await Client.PostAsJsonAsync(
            "/api/businesses",
            new
            {
                businessName = "Unauthenticated Business",
                industry = "Retail"
            });

        Assert.Equal(HttpStatusCode.Unauthorized, getResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, createResponse.StatusCode);
    }
}
