using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace BizBridge.Api.Tests;

public sealed class ExploreFlowTests : ApiTestBase
{
    [Fact]
    public async Task Public_business_content_supports_authenticated_social_actions()
    {
        var ownerToken = await RegisterAndLoginAsync();
        await CreateBusinessAsync(ownerToken, "Local Maker");
        await SetBusinessVisibleAsync(ownerToken);

        using var postResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            "/api/explore/posts",
            ownerToken,
            new { content = "A new update from our workshop." });
        Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);
        using var postJson = await JsonDocument.ParseAsync(
            await postResponse.Content.ReadAsStreamAsync());
        var postId = postJson.RootElement
            .GetProperty("explorePostID").GetInt32();

        using var productResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            "/api/explore/products",
            ownerToken,
            new
            {
                name = "Handmade bowl",
                category = "Home",
                description = "A locally crafted bowl.",
                price = 125m
            });
        Assert.Equal(HttpStatusCode.Created, productResponse.StatusCode);

        using var productJson = await JsonDocument.ParseAsync(
            await productResponse.Content.ReadAsStreamAsync());
        var productId = productJson.RootElement
            .GetProperty("exploreProductID").GetInt32();

        using var publicPosts = await Client.GetAsync("/api/explore/posts");
        using var publicProducts =
            await Client.GetAsync("/api/explore/products");
        Assert.Equal(HttpStatusCode.OK, publicPosts.StatusCode);
        Assert.Equal(HttpStatusCode.OK, publicProducts.StatusCode);
        Assert.Contains(
            postId.ToString(),
            await publicPosts.Content.ReadAsStringAsync());
        Assert.Contains(
            productId.ToString(),
            await publicProducts.Content.ReadAsStringAsync());

        var visitorToken = await RegisterAndLoginAsync(
            fullName: "Explore Visitor");
        using var likeResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Put,
            $"/api/explore/posts/{postId}/like",
            visitorToken,
            new { isActive = true });
        using var followResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Put,
            $"/api/explore/businesses/1/follow",
            visitorToken,
            new { isActive = true });
        using var saveProductResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Put,
            $"/api/explore/products/{productId}/save",
            visitorToken,
            new { isActive = true });

        Assert.Equal(HttpStatusCode.OK, likeResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, followResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, saveProductResponse.StatusCode);

        using var followingResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/explore/following",
            visitorToken);
        using var savedResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/explore/saved",
            visitorToken);
        using var savedJson = await JsonDocument.ParseAsync(
            await savedResponse.Content.ReadAsStreamAsync());

        Assert.Equal(HttpStatusCode.OK, followingResponse.StatusCode);
        Assert.Contains(
            productId,
            savedJson.RootElement.GetProperty("productIDs")
                .EnumerateArray().Select(item => item.GetInt32()));
    }

    [Fact]
    public async Task Customer_enquiry_is_visible_to_customer_and_business_owner()
    {
        var ownerToken = await RegisterAndLoginAsync();
        await CreateBusinessAsync(ownerToken, "Enquiry Business");
        await SetBusinessVisibleAsync(ownerToken);

        using var productResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            "/api/explore/products",
            ownerToken,
            new
            {
                name = "Custom gift",
                category = "Gifts",
                description = "Made to order.",
                price = 90m
            });
        using var productJson = await JsonDocument.ParseAsync(
            await productResponse.Content.ReadAsStreamAsync());
        var productId = productJson.RootElement
            .GetProperty("exploreProductID").GetInt32();

        var customerToken = await RegisterAndLoginAsync(
            fullName: "Interested Customer");
        using var enquiryResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            "/api/explore/enquiries",
            customerToken,
            new
            {
                businessID = 1,
                exploreProductID = productId,
                message = "Could you tell me more about this item?"
            });
        Assert.Equal(HttpStatusCode.Created, enquiryResponse.StatusCode);
        using var enquiryJson = await JsonDocument.ParseAsync(
            await enquiryResponse.Content.ReadAsStreamAsync());
        var enquiryId = enquiryJson.RootElement
            .GetProperty("businessEnquiryID").GetInt32();

        using var statusResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Put,
            $"/api/explore/enquiries/{enquiryId}/status",
            ownerToken,
            new { status = "InProgress" });
        using var replyResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Put,
            $"/api/explore/enquiries/{enquiryId}/response",
            ownerToken,
            new { message = "Yes, we can make this to your specifications." });
        using var sentResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/explore/enquiries/sent",
            customerToken);
        using var receivedResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/explore/enquiries/received",
            ownerToken);

        Assert.Equal(HttpStatusCode.OK, sentResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, receivedResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, statusResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, replyResponse.StatusCode);
        Assert.Contains(
            "Yes, we can make this to your specifications.",
            await sentResponse.Content.ReadAsStringAsync());
        Assert.Contains(
            "Yes, we can make this to your specifications.",
            await receivedResponse.Content.ReadAsStringAsync());

        using var closeResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Put,
            $"/api/explore/enquiries/{enquiryId}/status",
            ownerToken,
            new { status = "Closed" });
        using var closedReplyResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Put,
            $"/api/explore/enquiries/{enquiryId}/response",
            ownerToken,
            new { message = "This reply should be rejected after closure." });
        Assert.Equal(HttpStatusCode.OK, closeResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, closedReplyResponse.StatusCode);

        using var forbiddenStatusUpdate = await SendAuthorizedJsonAsync(
            HttpMethod.Put,
            $"/api/explore/enquiries/{enquiryId}/status",
            customerToken,
            new { status = "Closed" });
        Assert.Equal(HttpStatusCode.NotFound, forbiddenStatusUpdate.StatusCode);

        using var forbiddenReply = await SendAuthorizedJsonAsync(
            HttpMethod.Put,
            $"/api/explore/enquiries/{enquiryId}/response",
            customerToken,
            new { message = "This customer cannot reply as a business owner." });
        Assert.Equal(HttpStatusCode.NotFound, forbiddenReply.StatusCode);
    }

    [Fact]
    public async Task Explore_content_creation_requires_authentication()
    {
        using var postResponse = await Client.PostAsJsonAsync(
            "/api/explore/posts",
            new { content = "Unauthenticated post." });
        using var productResponse = await Client.PostAsJsonAsync(
            "/api/explore/products",
            new
            {
                name = "Product",
                category = "Other",
                price = 10m
            });

        Assert.Equal(HttpStatusCode.Unauthorized, postResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, productResponse.StatusCode);
    }

    private async Task SetBusinessVisibleAsync(string token)
    {
        using var response = await SendAuthorizedJsonAsync(
            HttpMethod.Put,
            "/api/businesses/mine/explore-visibility",
            token,
            new { isVisibleOnExplore = true });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
