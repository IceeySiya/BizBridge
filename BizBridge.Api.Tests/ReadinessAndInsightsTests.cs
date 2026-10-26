using System.Net;
using System.Text.Json;
using Xunit;

namespace BizBridge.Api.Tests;

public sealed class ReadinessAndInsightsTests : ApiTestBase
{
    [Fact]
    public async Task Readiness_progress_is_saved_for_the_business()
    {
        var token = await RegisterAndLoginAsync();
        await CreateBusinessAsync(token);

        using var initialResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/readiness/mine",
            token);
        Assert.Equal(HttpStatusCode.OK, initialResponse.StatusCode);
        using var initialJson = await JsonDocument.ParseAsync(
            await initialResponse.Content.ReadAsStreamAsync());

        Assert.Equal(6, initialJson.RootElement.GetProperty("totalCount").GetInt32());
        Assert.Equal(
            "business-profile",
            initialJson.RootElement.GetProperty("checks")[0]
                .GetProperty("id").GetString());

        using var updateResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Put,
            "/api/readiness/mine/3",
            token,
            new { isCompleted = true });
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        using var persistedResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/readiness/mine",
            token);
        using var persistedJson = await JsonDocument.ParseAsync(
            await persistedResponse.Content.ReadAsStreamAsync());
        var readiness = persistedJson.RootElement;

        Assert.Equal(2, readiness.GetProperty("completedCount").GetInt32());
        Assert.Equal(33, readiness.GetProperty("progressPercent").GetInt32());
        Assert.True(
            readiness.GetProperty("checks")[2]
                .GetProperty("isCompleted").GetBoolean());
        Assert.Contains(
            readiness.GetProperty("missingRequirements").EnumerateArray(),
            item => item.GetProperty("id").GetString() == "tax-records");
    }

    [Fact]
    public async Task Readiness_items_cannot_be_changed_for_another_business_or_automated()
    {
        var token = await RegisterAndLoginAsync();
        await CreateBusinessAsync(token);

        using var automatedResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Put,
            "/api/readiness/mine/1",
            token,
            new { isCompleted = false });
        Assert.Equal(HttpStatusCode.BadRequest, automatedResponse.StatusCode);

        var otherToken = await RegisterAndLoginAsync(
            fullName: "Another Founder");
        using var otherBusinessResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Put,
            "/api/readiness/mine/3",
            otherToken,
            new { isCompleted = true });
        Assert.Equal(HttpStatusCode.NotFound, otherBusinessResponse.StatusCode);
    }

    [Fact]
    public async Task Financial_insights_report_recorded_trends_and_expense_warnings()
    {
        var token = await RegisterAndLoginAsync();
        await CreateBusinessAsync(token);
        var businessId = await GetBusinessIdAsync(token);
        var incomeCategoryId = await CreateCategoryAsync(
            token,
            businessId,
            "Sales",
            "Income");
        var expenseCategoryId = await CreateCategoryAsync(
            token,
            businessId,
            "Supplies",
            "Expense");

        await CreateTransactionAsync(
            token,
            businessId,
            incomeCategoryId,
            2000m,
            DateTimeOffset.UtcNow);
        await CreateTransactionAsync(
            token,
            businessId,
            expenseCategoryId,
            500m,
            DateTimeOffset.UtcNow.AddMonths(-1));
        await CreateTransactionAsync(
            token,
            businessId,
            expenseCategoryId,
            2500m,
            DateTimeOffset.UtcNow);

        using var response = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            $"/api/businesses/{businessId}/financial-insights",
            token);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var json = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync());
        var insights = json.RootElement;

        Assert.Equal(6, insights.GetProperty("cashFlowByMonth").GetArrayLength());
        Assert.Equal(
            -500m,
            insights.GetProperty("cashFlowByMonth")[5]
                .GetProperty("netCashFlow").GetDecimal());
        Assert.Equal(
            "Supplies",
            insights.GetProperty("spendingByCategory")[0]
                .GetProperty("category").GetString());
        Assert.Contains(
            insights.GetProperty("warnings").EnumerateArray(),
            warning => warning.GetProperty("message").GetString()!
                .Contains("recorded expenses exceeded recorded income"));
        Assert.Contains(
            insights.GetProperty("warnings").EnumerateArray(),
            warning => warning.GetProperty("message").GetString()!
                .Contains("higher than the same elapsed calendar period"));
        Assert.Contains(
            insights.GetProperty("recommendations").EnumerateArray(),
            recommendation => recommendation.GetProperty("message").GetString()!
                .Contains("Prioritise essential spending"));
        Assert.Contains(
            insights.GetProperty("recommendations").EnumerateArray(),
            recommendation => recommendation.GetProperty("message").GetString()!
                .Contains("history is incomplete or inconsistent"));
        Assert.Contains(
            "not guaranteed predictions",
            insights.GetProperty("basis").GetString());
    }

    [Fact]
    public async Task Financial_insights_recommendations_follow_recorded_monthly_trends()
    {
        var token = await RegisterAndLoginAsync();
        await CreateBusinessAsync(token);
        var businessId = await GetBusinessIdAsync(token);
        var incomeCategoryId = await CreateCategoryAsync(
            token,
            businessId,
            "Sales",
            "Income");
        var expenseCategoryId = await CreateCategoryAsync(
            token,
            businessId,
            "Supplies",
            "Expense");

        using var initialResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            $"/api/businesses/{businessId}/financial-insights",
            token);
        using var initialJson = await JsonDocument.ParseAsync(
            await initialResponse.Content.ReadAsStreamAsync());
        Assert.Contains(
            initialJson.RootElement.GetProperty("recommendations")
                .EnumerateArray(),
            recommendation => recommendation.GetProperty("message")
                .GetString()!.Contains("history is incomplete or inconsistent"));

        var now = DateTimeOffset.UtcNow;
        for (var monthsAgo = 2; monthsAgo >= 0; monthsAgo--)
        {
            var transactionDate = now.AddMonths(-monthsAgo);
            await CreateTransactionAsync(
                token,
                businessId,
                incomeCategoryId,
                (monthsAgo + 1) * 1000m,
                transactionDate);
            await CreateTransactionAsync(
                token,
                businessId,
                expenseCategoryId,
                (3 - monthsAgo) * 500m,
                transactionDate);
        }

        using var response = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            $"/api/businesses/{businessId}/financial-insights",
            token);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var json = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync());
        var insights = json.RootElement;

        Assert.Contains(
            insights.GetProperty("warnings").EnumerateArray(),
            warning => warning.GetProperty("message").GetString()!
                .Contains("expenses have increased over three consecutive months"));
        Assert.Contains(
            insights.GetProperty("warnings").EnumerateArray(),
            warning => warning.GetProperty("message").GetString()!
                .Contains("income has declined over three consecutive months"));
        Assert.Contains(
            insights.GetProperty("recommendations").EnumerateArray(),
            recommendation => recommendation.GetProperty("message").GetString()!
                .Contains("Review your largest expense categories"));
        Assert.Contains(
            insights.GetProperty("recommendations").EnumerateArray(),
            recommendation => recommendation.GetProperty("message").GetString()!
                .Contains("Review sales trends and customer activity"));
        Assert.DoesNotContain(
            insights.GetProperty("recommendations").EnumerateArray(),
            recommendation => recommendation.GetProperty("message").GetString()!
                .Contains("history is incomplete or inconsistent"));
    }

    private async Task<int> GetBusinessIdAsync(string token)
    {
        using var response = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/businesses/mine",
            token);
        using var json = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync());
        return json.RootElement.GetProperty("businessID").GetInt32();
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

    private async Task CreateTransactionAsync(
        string token,
        int businessId,
        int categoryId,
        decimal amount,
        DateTimeOffset transactionDate)
    {
        using var response = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            $"/api/businesses/{businessId}/transactions",
            token,
            new
            {
                categoryID = categoryId,
                amount,
                transactionDate
            });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }
}
