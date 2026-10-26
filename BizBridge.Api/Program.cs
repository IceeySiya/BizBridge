
using System.Security.Claims;
using System.Text;

using BizBridge.Api.Data;
using BizBridge.Api.Services.Auth;
using BizBridge.Api.Services.Business;
using BizBridge.Api.Services.Categories;
using BizBridge.Api.Services.Images;
using BizBridge.Api.Services.Transactions;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// --------------------------------------------------
// Services
// --------------------------------------------------

builder.Services.AddOpenApi();

builder.Services.AddDbContext<BizBridgeDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// Authentication services
builder.Services.AddScoped<PasswordService>();
builder.Services.AddScoped<JwtService>();

// Business and image services
builder.Services.AddScoped<BusinessService>();
builder.Services.AddScoped<CloudinaryImageService>();

// Category and transaction services
builder.Services.AddScoped<CategoryService>();
builder.Services.AddScoped<TransactionService>();

// Financial summary and insights
builder.Services.AddScoped<FinancialSummaryService>();
builder.Services.AddScoped<FinancialInsightsService>();

// Financial predictions
builder.Services.AddScoped<FinancialForecastService>();
builder.Services.AddScoped<FinancialPredictionWarningService>();
builder.Services.AddScoped<FinancialPredictionService>();

// --------------------------------------------------
// JWT Authentication
// --------------------------------------------------

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "JWT signing key is not configured.");

var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException(
        "JWT issuer is not configured.");

var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException(
        "JWT audience is not configured.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,

                ValidateAudience = true,
                ValidAudience = jwtAudience,

                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtKey)),

                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,

                NameClaimType = ClaimTypes.Name,
                RoleClaimType = ClaimTypes.Role
            };
    });

// --------------------------------------------------
// CORS
// --------------------------------------------------

builder.Services.AddCors(options =>
{
    options.AddPolicy("BizBridgeFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://127.0.0.1:5500",
                "http://localhost:5500",
                "http://127.0.0.1:5501",
                "http://localhost:5501",
                "http://127.0.0.1:8765",
                "http://localhost:8765",
                "https://bizbridgefrontend.netlify.app",
                "https://bizbridge.pages.dev"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// --------------------------------------------------
// Authorization and controllers
// --------------------------------------------------

builder.Services.AddAuthorization();
builder.Services.AddControllers();

// --------------------------------------------------
// Build application
// --------------------------------------------------

var app = builder.Build();

// --------------------------------------------------
// HTTP request pipeline
// --------------------------------------------------

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseRouting();

app.UseCors("BizBridgeFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// --------------------------------------------------
// Default WeatherForecast endpoint
// --------------------------------------------------

var summaries = new[]
{
    "Freezing",
    "Bracing",
    "Chilly",
    "Cool",
    "Mild",
    "Warm",
    "Balmy",
    "Hot",
    "Sweltering",
    "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5)
        .Select(index =>
            new WeatherForecast(
                DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                Random.Shared.Next(-20, 55),
                summaries[Random.Shared.Next(summaries.Length)]
            ))
        .ToArray();

    return forecast;
})
.WithName("GetWeatherForecast");

app.Run();

// --------------------------------------------------
// Supporting model
// --------------------------------------------------

record WeatherForecast(
    DateOnly Date,
    int TemperatureC,
    string? Summary)
{
    public int TemperatureF =>
        32 + (int)(TemperatureC / 0.5556);
}

// Required for integration testing
public partial class Program { }
