using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using QuestPDF.Infrastructure;
using ShareTracker.Application;
using ShareTracker.Application.Common.Behaviors;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Reports;
using ShareTracker.Domain.Interfaces.Repositories;
using ShareTracker.Infrastructure.Persistence;
using ShareTracker.Infrastructure.Persistence.Repositories;
using ShareTracker.Infrastructure.Services;
using ShareTracker.API.Conventions;
using ShareTracker.API.Middleware;

// QuestPDF community licence (free for projects up to $1M revenue)
QuestPDF.Settings.License = LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

// ── Application layer ────────────────────────────────────────────────────────
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(AssemblyMarker).Assembly));

builder.Services.AddValidatorsFromAssembly(typeof(AssemblyMarker).Assembly);

builder.Services.AddTransient(
    typeof(IPipelineBehavior<,>),
    typeof(ValidationBehavior<,>));

// ── Infrastructure: EF Core ──────────────────────────────────────────────────
// Npgsql 8 doesn't parse postgres:// URIs — convert to key=value format when needed
static string NormalizeConnectionString(string cs)
{
    if (!cs.StartsWith("postgres://") && !cs.StartsWith("postgresql://"))
        return cs;
    var uri      = new Uri(cs);
    var userInfo = uri.UserInfo.Split(':', 2);
    var user     = Uri.UnescapeDataString(userInfo[0]);
    var pass     = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
    var port     = uri.Port > 0 ? uri.Port : 5432;
    var db       = uri.AbsolutePath.TrimStart('/');
    return $"Host={uri.Host};Port={port};Database={db};Username={user};Password={pass};SSL Mode=Require;Trust Server Certificate=true;";
}

builder.Services.AddDbContext<ShareTrackerDbContext>(opts =>
    opts.UseNpgsql(NormalizeConnectionString(
        builder.Configuration.GetConnectionString("DefaultConnection")!)));

// ── Infrastructure: Clerk JWT validation ─────────────────────────────────────
// Clerk issues RS256 tokens; the middleware fetches and caches JWKS automatically
// from {Authority}/.well-known/openid-configuration.
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.Authority        = builder.Configuration["Clerk:Authority"];
        opts.MapInboundClaims = false;
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,   // Clerk does not set aud by default
            NameClaimType    = "sub",
        };
    });

builder.Services.AddAuthorization();

// ── Infrastructure: Services & Repositories ──────────────────────────────────
builder.Services.AddScoped<ITradeRepository, TradeRepository>();
builder.Services.AddScoped<IUserProfileRepository, UserProfileRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IReportGeneratorService, ReportGeneratorService>();

// ── Infrastructure: Market data (EODHD) ──────────────────────────────────────
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient("eodhd", client =>
{
    client.Timeout = TimeSpan.FromSeconds(10);
});
builder.Services.Configure<EodhdSettings>(
    builder.Configuration.GetSection("EodhdSettings"));
builder.Services.AddScoped<IMarketDataService, EodhdMarketDataService>();

// ── CORS ─────────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000"];

builder.Services.AddCors(opts =>
    opts.AddPolicy("Frontend", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

// ── API layer ────────────────────────────────────────────────────────────────
builder.Services.AddControllers(opts =>
{
    if (builder.Environment.IsStaging())
        opts.Conventions.Add(new ApiPrefixConvention());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(opts =>
{
    opts.SwaggerDoc("v1", new OpenApiInfo { Title = "ShareTracker API", Version = "v1" });

    opts.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT",
        In           = ParameterLocation.Header,
        Description  = "Enter your Clerk session JWT."
    });

    opts.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Auto-apply EF Core migrations on startup (safe — idempotent)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ShareTrackerDbContext>();
    db.Database.Migrate();
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors("Frontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
