using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace BizBridge.Api.Tests;

public sealed class FounderJourneyTests : ApiTestBase
{
    [Fact]
    public async Task Founder_can_manage_finances_and_complete_an_explore_enquiry()
    {
        var founderToken = await RegisterAndLoginAsync(
            fullName: "Community Founder");
        await CreateBusinessAsync(founderToken, "Community Bakery");

        using var businessResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/businesses/mine",
            founderToken);
        Assert.Equal(HttpStatusCode.OK, businessResponse.StatusCode);
        using var businessJson = await JsonDocument.ParseAsync(
            await businessResponse.Content.ReadAsStreamAsync());
        var businessId = businessJson.RootElement
            .GetProperty("businessID").GetInt32();

        var incomeCategoryId = await CreateCategoryAsync(
            founderToken, businessId, "Sales", "Income");
        using var transactionResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            $"/api/businesses/{businessId}/transactions",
            founderToken,
            new
            {
                categoryID = incomeCategoryId,
                amount = 1800m,
                description = "Weekend market sales",
                paymentReference = "MARKET-2026-01",
                transactionDate = DateTimeOffset.UtcNow
            });
        Assert.Equal(HttpStatusCode.Created, transactionResponse.StatusCode);

        using var insightsResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            $"/api/businesses/{businessId}/financial-insights",
            founderToken);
        Assert.Equal(HttpStatusCode.OK, insightsResponse.StatusCode);
        using var insightsJson = await JsonDocument.ParseAsync(
            await insightsResponse.Content.ReadAsStreamAsync());
        Assert.Contains(
            insightsJson.RootElement.GetProperty("cashFlowByMonth")
                .EnumerateArray(),
            month =>
                month.GetProperty("income").GetDecimal() == 1800m &&
                month.GetProperty("transactionCount").GetInt32() == 1);

        using var visibilityResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Put,
            "/api/businesses/mine/explore-visibility",
            founderToken,
            new { isVisibleOnExplore = true });
        Assert.Equal(HttpStatusCode.OK, visibilityResponse.StatusCode);

        using var postResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            "/api/explore/posts",
            founderToken,
            new { content = "Fresh bread at our community market this weekend." });
        Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);
        using var postJson = await JsonDocument.ParseAsync(
            await postResponse.Content.ReadAsStreamAsync());
        var postId = postJson.RootElement
            .GetProperty("explorePostID").GetInt32();

        using var productResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            "/api/explore/products",
            founderToken,
            new
            {
                name = "Market bread box",
                category = "Food",
                description = "A box of fresh bread for local customers.",
                price = 95m
            });
        Assert.Equal(HttpStatusCode.Created, productResponse.StatusCode);
        using var productJson = await JsonDocument.ParseAsync(
            await productResponse.Content.ReadAsStreamAsync());
        var productId = productJson.RootElement
            .GetProperty("exploreProductID").GetInt32();

        var customerToken = await RegisterAndLoginAsync(
            fullName: "Interested Customer");
        using var unauthorizedLike = await Client.PutAsJsonAsync(
            $"/api/explore/posts/{postId}/like",
            new { isActive = true });
        Assert.Equal(HttpStatusCode.Unauthorized, unauthorizedLike.StatusCode);

        await SetExploreStateAsync(
            $"/api/explore/posts/{postId}/like", customerToken, true);
        await SetExploreStateAsync(
            $"/api/explore/posts/{postId}/save", customerToken, true);
        await SetExploreStateAsync(
            $"/api/explore/products/{productId}/save", customerToken, true);
        await SetExploreStateAsync(
            $"/api/explore/businesses/{businessId}/save",
            customerToken,
            true);
        await SetExploreStateAsync(
            $"/api/explore/businesses/{businessId}/follow",
            customerToken,
            true);

        using var savedResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/explore/saved",
            customerToken);
        using var savedJson = await JsonDocument.ParseAsync(
            await savedResponse.Content.ReadAsStreamAsync());
        Assert.Contains(
            postId,
            savedJson.RootElement.GetProperty("postIDs")
                .EnumerateArray().Select(item => item.GetInt32()));
        Assert.Contains(
            productId,
            savedJson.RootElement.GetProperty("productIDs")
                .EnumerateArray().Select(item => item.GetInt32()));
        Assert.Contains(
            businessId,
            savedJson.RootElement.GetProperty("businessIDs")
                .EnumerateArray().Select(item => item.GetInt32()));

        using var followingResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/explore/following",
            customerToken);
        using var followingJson = await JsonDocument.ParseAsync(
            await followingResponse.Content.ReadAsStreamAsync());
        Assert.Contains(
            followingJson.RootElement.EnumerateArray(),
            business => business.GetProperty("businessID").GetInt32() ==
                businessId);

        using var publicPostsResponse = await Client.GetAsync(
            "/api/explore/posts");
        using var publicPostsJson = await JsonDocument.ParseAsync(
            await publicPostsResponse.Content.ReadAsStreamAsync());
        Assert.Contains(
            publicPostsJson.RootElement.EnumerateArray(),
            post => post.GetProperty("explorePostID").GetInt32() == postId);

        using var enquiryResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            "/api/explore/enquiries",
            customerToken,
            new
            {
                businessID = businessId,
                exploreProductID = productId,
                message = "Can I collect this at the weekend market?"
            });
        Assert.Equal(HttpStatusCode.Created, enquiryResponse.StatusCode);
        using var enquiryJson = await JsonDocument.ParseAsync(
            await enquiryResponse.Content.ReadAsStreamAsync());
        var enquiryId = enquiryJson.RootElement
            .GetProperty("businessEnquiryID").GetInt32();

        using var responseToEnquiry = await SendAuthorizedJsonAsync(
            HttpMethod.Put,
            $"/api/explore/enquiries/{enquiryId}/response",
            founderToken,
            new { message = "Yes, collection is available on Saturday." });
        Assert.Equal(HttpStatusCode.OK, responseToEnquiry.StatusCode);

        using var sentEnquiriesResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/explore/enquiries/sent",
            customerToken);
        using var sentEnquiriesJson = await JsonDocument.ParseAsync(
            await sentEnquiriesResponse.Content.ReadAsStreamAsync());
        Assert.Contains(
            sentEnquiriesJson.RootElement.EnumerateArray(),
            enquiry =>
                enquiry.GetProperty("businessEnquiryID").GetInt32() ==
                    enquiryId &&
                enquiry.GetProperty("businessResponse").GetString() ==
                    "Yes, collection is available on Saturday.");
    }

    private async Task<int> CreateCategoryAsync(
        string token,
        int businessId,
        string name,
        string transactionType)
    {
        using var response = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            $"/api/businesses/{businessId}/categories",
            token,
            new { name, transactionType });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var json = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync());
        return json.RootElement.GetProperty("category")
            .GetProperty("categoryID").GetInt32();
    }

    private async Task SetExploreStateAsync(
        string path,
        string token,
        bool isActive)
    {
        using var response = await SendAuthorizedJsonAsync(
            HttpMethod.Put,
            path,
            token,
            new { isActive });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
