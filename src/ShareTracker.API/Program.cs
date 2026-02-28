using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ShareTracker.Application;
using ShareTracker.Application.Common.Behaviors;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Domain.Interfaces.Repositories;
using ShareTracker.Infrastructure.Persistence;
using ShareTracker.Infrastructure.Persistence.Repositories;
using ShareTracker.Infrastructure.Services;
using ShareTracker.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// ── Application layer ────────────────────────────────────────────────────────
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(AssemblyMarker).Assembly));

builder.Services.AddValidatorsFromAssembly(typeof(AssemblyMarker).Assembly);

builder.Services.AddTransient(
    typeof(IPipelineBehavior<,>),
    typeof(ValidationBehavior<,>));

// ── Infrastructure: EF Core ──────────────────────────────────────────────────
builder.Services.AddDbContext<ShareTrackerDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

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
builder.Services.AddControllers();
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
