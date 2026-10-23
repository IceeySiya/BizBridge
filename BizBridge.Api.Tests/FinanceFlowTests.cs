using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace BizBridge.Api.Tests;

public sealed class FinanceFlowTests : ApiTestBase
{
    [Fact]
    public async Task Transactions_update_monthly_summary_and_readiness()
    {
        var token = await RegisterAndLoginAsync();
        await CreateBusinessAsync(token);

        using var initialReadinessResponse =
            await SendAuthorizedJsonAsync(
                HttpMethod.Get,
                "/api/readiness/mine",
                token);
        using var initialReadinessJson = await JsonDocument.ParseAsync(
            await initialReadinessResponse.Content.ReadAsStreamAsync());
        Assert.Equal(
            17,
            initialReadinessJson.RootElement
                .GetProperty("progressPercent").GetInt32());

        var businessId = await GetBusinessIdAsync(token);
        var incomeCategoryId = await CreateCategoryAsync(
            token,
            businessId,
            "Catering",
            "Income");
        var expenseCategoryId = await CreateCategoryAsync(
            token,
            businessId,
            "Supplies",
            "Expense");

        using var incomeResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            $"/api/businesses/{businessId}/transactions",
            token,
            new
            {
                categoryID = incomeCategoryId,
                amount = 2500m,
                description = "Community event catering",
                paymentReference = "PAY-1001",
                transactionDate = DateTimeOffset.UtcNow
            });
        using var expenseResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            $"/api/businesses/{businessId}/transactions",
            token,
            new
            {
                categoryID = expenseCategoryId,
                amount = 850m,
                description = "Food supplies",
                transactionDate = DateTimeOffset.UtcNow
            });

        Assert.Equal(HttpStatusCode.Created, incomeResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Created, expenseResponse.StatusCode);

        using var summaryResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            $"/api/businesses/{businessId}/financial-summary",
            token);
        Assert.Equal(HttpStatusCode.OK, summaryResponse.StatusCode);
        using var summaryJson = await JsonDocument.ParseAsync(
            await summaryResponse.Content.ReadAsStreamAsync());
        var summary = summaryJson.RootElement;
        Assert.Equal(2500m, summary.GetProperty("totalIncome").GetDecimal());
        Assert.Equal(850m, summary.GetProperty("totalExpenses").GetDecimal());
        Assert.Equal(1650m, summary.GetProperty("netCashFlow").GetDecimal());

        using var readinessResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/readiness/mine",
            token);
        using var readinessJson = await JsonDocument.ParseAsync(
            await readinessResponse.Content.ReadAsStreamAsync());
        Assert.Equal(
            33,
            readinessJson.RootElement
                .GetProperty("progressPercent").GetInt32());
        Assert.Contains(
            "not a credit score",
            readinessJson.RootElement.GetProperty("basis").GetString());

        using var transactionsResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            $"/api/businesses/{businessId}/transactions",
            token);
        using var transactionsJson = await JsonDocument.ParseAsync(
            await transactionsResponse.Content.ReadAsStreamAsync());
        Assert.Equal(
            2,
            transactionsJson.RootElement.GetArrayLength());
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

    [Fact]
    public async Task Duplicate_payment_reference_creates_a_review_alert()
    {
        var token = await RegisterAndLoginAsync();
        await CreateBusinessAsync(token);
        var transaction = new
        {
            transactionType = "Income",
            category = "Sales",
            amount = 500m,
            paymentReference = "ABC-123"
        };

        using var firstResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            "/api/transactions",
            token,
            transaction);
        using var duplicateResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            "/api/transactions",
            token,
            new
            {
                transactionType = "Income",
                category = "Sales",
                amount = 900m,
                paymentReference = "abc-123"
            });

        Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Created, duplicateResponse.StatusCode);
        using var duplicateJson = await JsonDocument.ParseAsync(
            await duplicateResponse.Content.ReadAsStreamAsync());
        Assert.True(
            duplicateJson.RootElement
                .GetProperty("paymentReviewRequired").GetBoolean());

        using var alertsResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/payment-alerts/mine",
            token);
        Assert.Equal(HttpStatusCode.OK, alertsResponse.StatusCode);
        using var alertsJson = await JsonDocument.ParseAsync(
            await alertsResponse.Content.ReadAsStreamAsync());
        Assert.Equal(1, alertsJson.RootElement.GetArrayLength());
        Assert.Equal(
            "Open",
            alertsJson.RootElement[0].GetProperty("status").GetString());
        Assert.Contains(
            "does not confirm fraud",
            alertsJson.RootElement[0].GetProperty("message").GetString());
    }

    [Fact]
    public async Task Financial_records_and_alerts_are_isolated_by_business_owner()
    {
        var ownerToken = await RegisterAndLoginAsync();
        await CreateBusinessAsync(ownerToken);
        var transaction = new
        {
            transactionType = "Income",
            category = "Sales",
            amount = 250m,
            paymentReference = "PRIVATE-REF"
        };
        using var firstTransaction = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            "/api/transactions",
            ownerToken,
            transaction);
        using var duplicateTransaction = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            "/api/transactions",
            ownerToken,
            transaction);
        Assert.Equal(HttpStatusCode.Created, firstTransaction.StatusCode);
        Assert.Equal(HttpStatusCode.Created, duplicateTransaction.StatusCode);

        var otherFounderToken = await RegisterAndLoginAsync(
            fullName: "Another Founder");
        await CreateBusinessAsync(otherFounderToken, "Another Business");

        using var summaryResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/transactions/summary",
            otherFounderToken);
        using var transactionsResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/transactions",
            otherFounderToken);
        using var alertsResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/payment-alerts/mine",
            otherFounderToken);
        using var summaryJson = await JsonDocument.ParseAsync(
            await summaryResponse.Content.ReadAsStreamAsync());
        using var transactionsJson = await JsonDocument.ParseAsync(
            await transactionsResponse.Content.ReadAsStreamAsync());
        using var alertsJson = await JsonDocument.ParseAsync(
            await alertsResponse.Content.ReadAsStreamAsync());

        Assert.Equal(0m, summaryJson.RootElement.GetProperty("income").GetDecimal());
        Assert.Equal(0, transactionsJson.RootElement.GetArrayLength());
        Assert.Equal(0, alertsJson.RootElement.GetArrayLength());
    }

    [Fact]
    public async Task Transaction_endpoints_require_authentication()
    {
        using var summaryResponse =
            await Client.GetAsync("/api/transactions/summary");
        using var createResponse = await Client.PostAsJsonAsync(
            "/api/transactions",
            new
            {
                transactionType = "Income",
                category = "Sales",
                amount = 100m
            });

        Assert.Equal(HttpStatusCode.Unauthorized, summaryResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, createResponse.StatusCode);
    }

    [Fact]
    public async Task Transaction_rejects_invalid_type_and_non_positive_amount()
    {
        var token = await RegisterAndLoginAsync();
        await CreateBusinessAsync(token);

        using var invalidTypeResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            "/api/transactions",
            token,
            new
            {
                transactionType = "Transfer",
                category = "Sales",
                amount = 100m
            });
        using var invalidAmountResponse = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            "/api/transactions",
            token,
            new
            {
                transactionType = "Income",
                category = "Sales",
                amount = 0m
            });

        Assert.Equal(HttpStatusCode.BadRequest, invalidTypeResponse.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, invalidAmountResponse.StatusCode);
    }

    [Fact]
    public async Task Opportunities_only_return_published_records()
    {
        var token = await RegisterAndLoginAsync();
        await SeedOpportunityAsync(
            "Published catering opportunity",
            "Published",
            DateTimeOffset.UtcNow.AddDays(14));
        await SeedOpportunityAsync(
            "Draft catering opportunity",
            "Draft",
            DateTimeOffset.UtcNow.AddDays(30));
        await SeedOpportunityAsync(
            "Expired catering opportunity",
            "Published",
            DateTimeOffset.UtcNow.AddDays(-1));

        using var response = await SendAuthorizedJsonAsync(
            HttpMethod.Get,
            "/api/opportunities",
            token);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var json = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync());
        Assert.Equal(1, json.RootElement.GetArrayLength());
        Assert.Equal(
            "Published catering opportunity",
            json.RootElement[0].GetProperty("title").GetString());
    }

    [Fact]
    public async Task Readiness_requires_authentication()
    {
        using var response = await Client.GetAsync("/api/readiness/mine");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
