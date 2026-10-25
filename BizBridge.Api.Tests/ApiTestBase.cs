using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using BizBridge.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;

namespace BizBridge.Api.Tests;

public abstract class ApiTestBase : IDisposable
{
    private readonly TestApiFactory _factory;
    protected HttpClient Client { get; }

    protected ApiTestBase()
    {
        _factory = new TestApiFactory();
        Client = _factory.CreateClient();
        _factory.InitializeDatabase();
    }

    protected async Task<string> RegisterAndLoginAsync(
        string? email = null,
        string fullName = "Thandi Mokoena")
    {
        email ??= $"thandi-{Guid.NewGuid():N}@example.test";
        var password = "BizBridge-Test-Password-2026";

        using var registerResponse = await Client.PostAsJsonAsync(
            "/api/auth/register",
            new { fullName, email, password });
        Xunit.Assert.Equal(HttpStatusCode.Created, registerResponse.StatusCode);

        using var loginResponse = await Client.PostAsJsonAsync(
            "/api/auth/login",
            new { email, password });
        Xunit.Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        using var json = await JsonDocument.ParseAsync(
            await loginResponse.Content.ReadAsStreamAsync());
        return json.RootElement.GetProperty("accessToken").GetString()
            ?? throw new InvalidOperationException(
                "The login response did not contain an access token.");
    }

    protected async Task CreateBusinessAsync(
        string token,
        string businessName = "Thandi's Catering")
    {
        using var response = await SendAuthorizedJsonAsync(
            HttpMethod.Post,
            "/api/businesses",
            token,
            new
            {
                businessName,
                industry = "Food Services",
                location = "Soweto"
            });

        Xunit.Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    protected Task SeedOpportunityAsync(
        string title,
        string status,
        DateTimeOffset deadline)
    {
        return _factory.SeedOpportunityAsync(title, status, deadline);
    }

    protected HttpRequestMessage CreateAuthorizedRequest(
        HttpMethod method,
        string uri,
        string token)
    {
        var request = new HttpRequestMessage(method, uri);
        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    protected Task<HttpResponseMessage> SendAuthorizedJsonAsync(
        HttpMethod method,
        string uri,
        string token,
        object? body = null)
    {
        var request = CreateAuthorizedRequest(method, uri, token);
        if (body is not null)
        {
            request.Content = JsonContent.Create(body);
        }

        return Client.SendAsync(request);
    }

    public void Dispose()
    {
        Client.Dispose();
        _factory.Dispose();
    }
}

internal sealed class TestApiFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection =
        new("Data Source=:memory:");

    static TestApiFactory()
    {
        // Program validates JWT configuration before WebApplicationFactory
        // applies its web-host configuration callbacks.
        Environment.SetEnvironmentVariable(
            "Jwt__Key",
            "BizBridge-test-signing-key-with-more-than-32-bytes");
        Environment.SetEnvironmentVariable("Jwt__Issuer", "BizBridge.Tests");
        Environment.SetEnvironmentVariable("Jwt__Audience", "BizBridge.Tests");
    }

    public TestApiFactory()
    {
        _connection.Open();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration(configuration =>
            configuration.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["Cloudinary:CloudName"] = "test",
                    ["Cloudinary:ApiKey"] = "test",
                    ["Cloudinary:ApiSecret"] = "test"
                }));
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<
                IDbContextOptionsConfiguration<BizBridgeDbContext>>();
            services.RemoveAll<DbContextOptions<BizBridgeDbContext>>();
            services.RemoveAll<BizBridgeDbContext>();
            services.AddDbContext<BizBridgeDbContext>(options =>
                options.UseSqlite(_connection));
        });
    }

    public void InitializeDatabase()
    {
        using var scope = Services.CreateScope();
        var context = scope.ServiceProvider
            .GetRequiredService<BizBridgeDbContext>();
        context.Database.EnsureCreated();
    }

    public async Task SeedOpportunityAsync(
        string title,
        string status,
        DateTimeOffset deadline)
    {
        using var scope = Services.CreateScope();
        var context = scope.ServiceProvider
            .GetRequiredService<BizBridgeDbContext>();
        var manager = new BizBridge.Api.Models.User
        {
            FullName = "Test Opportunity Manager",
            Email = $"manager-{Guid.NewGuid():N}@example.test",
            PasswordHash = "test-only-hash",
            Role = "OpportunityManager"
        };
        context.Users.Add(manager);
        await context.SaveChangesAsync();

        context.Opportunities.Add(new BizBridge.Api.Models.Opportunity
        {
            ManagedByUserID = manager.UserID,
            Title = title,
            Organisation = "Test Organisation",
            Description = "Opportunity used by an isolated integration test.",
            Deadline = deadline,
            Status = status,
            CreatedAt = DateTimeOffset.UtcNow
        });
        await context.SaveChangesAsync();
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
        {
            _connection.Dispose();
        }
    }
}
