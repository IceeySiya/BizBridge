using System.Net;
using System.Text.Json;
using Xunit;

namespace BizBridge.Api.Tests;

public sealed class BusinessProfileFlowTests : ApiTestBase
{
    [Fact]
    public async Task Founder_can_create_and_read_back_a_business_profile()
    {
        var token = await RegisterAndLoginAsync();
        using var missingProfileResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/businesses/mine",
            token);
        Assert.Equal(HttpStatusCode.NotFound, missingProfileResponse.StatusCode);

        var established = new DateTimeOffset(2022, 3, 14, 0, 0, 0, TimeSpan.Zero);
        var profile = new
        {
            businessName = "Thandi's Catering",
            industry = "Food Services",
            location = "Soweto, Gauteng",
            description = "Catering for community and corporate events.",
            established
        };
        using var createResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            "/api/businesses",
            token,
            profile);

        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);

        using var readBackResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/businesses/mine",
            token);
        Assert.Equal(HttpStatusCode.OK, readBackResponse.StatusCode);

        using var json = await JsonDocument.ParseAsync(
            await readBackResponse.Content.ReadAsStreamAsync());
        var business = json.RootElement;
        Assert.Equal(
            "Thandi's Catering",
            business.GetProperty("businessName").GetString());
        Assert.Equal(
            "Food Services",
            business.GetProperty("industry").GetString());
        Assert.Equal(
            "Soweto, Gauteng",
            business.GetProperty("location").GetString());
        Assert.Equal(
            "Catering for community and corporate events.",
            business.GetProperty("description").GetString());
        Assert.Equal(
            established,
            business.GetProperty("established").GetDateTimeOffset());

        using var updateResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Put,
            "/api/businesses/mine",
            token,
            new
            {
                businessName = "Thandi's Catering Co.",
                industry = "Food Services",
                location = "Soweto, Gauteng",
                description = "Catering for local events."
            });
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        using var updatedProfileResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/businesses/mine",
            token);
        using var updatedJson = await JsonDocument.ParseAsync(
            await updatedProfileResponse.Content.ReadAsStreamAsync());
        Assert.Equal(
            "Thandi's Catering Co.",
            updatedJson.RootElement.GetProperty("businessName").GetString());
        Assert.Equal(
            established,
            updatedJson.RootElement.GetProperty("established").GetDateTimeOffset());
    }

    [Fact]
    public async Task Founder_cannot_create_a_second_business_profile()
    {
        var token = await RegisterAndLoginAsync();
        var profile = new
        {
            businessName = "First Business",
            industry = "Catering"
        };

        using var firstResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            "/api/businesses",
            token,
            profile);
        using var secondResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            "/api/businesses",
            token,
            new { businessName = "Second Business", industry = "Retail" });

        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, secondResponse.StatusCode);
    }

    [Fact]
    public async Task Business_profile_requires_a_name_and_industry()
    {
        var token = await RegisterAndLoginAsync();

        using var response = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            "/api/businesses",
            token,
            new { businessName = "", industry = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
