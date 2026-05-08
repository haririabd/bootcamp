using System.Threading.RateLimiting;
using FluentValidation;
using KanbanApi.Data;
using KanbanApi.Endpoints;
using KanbanApi.Infrastructure;
using KanbanApi.Models;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Serilog;
using Serilog.Formatting.Compact;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting web application build...");
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console(context.HostingEnvironment.IsDevelopment()
            ? new Serilog.Formatting.Display.MessageTemplateTextFormatter("[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
            : new RenderedCompactJsonFormatter()));

    builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
    builder.Services.AddProblemDetails();

    builder.Services.AddValidatorsFromAssemblyContaining<Program>();

    var isDevelopment = builder.Environment.IsDevelopment();

    var connectionString = builder.Configuration["DATABASE_URL"]
                           ?? builder.Configuration.GetConnectionString("DefaultConnection");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        throw new InvalidOperationException("CRITICAL: DATABASE_URL or DefaultConnection is missing. The application cannot start.");
    }

    if (!isDevelopment)
    {
        var corsOrigins = builder.Configuration["CORS_ORIGINS"];
        if (string.IsNullOrWhiteSpace(corsOrigins))
        {
            throw new InvalidOperationException("CRITICAL: CORS_ORIGINS environment variable is missing in production. Example: 'https://app.com;https://admin.com'");
        }
    }

    // ─── OpenAPI (Swagger) ─────────────────────────────────────────
    builder.Services.AddOpenApi();

    // ─── Real-Time Sync (Phase 6) ──────────────────────────────────
    builder.Services.AddSignalR();

    // ─── Forwarded Headers ─────────────────────────────────────────
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.KnownIPNetworks.Clear();
        options.KnownProxies.Clear();
    });

    // ─── Health Checks ─────────────────────────────────────────────
    builder.Services.AddHealthChecks()
        .AddDbContextCheck<AppDbContext>(
            name: "database",
            tags: ["ready"]);

    // ─── CORS ──────────────────────────────────────────────────────
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            if (isDevelopment)
            {
                policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            }
            else
            {
                var allowedOrigins = builder.Configuration["CORS_ORIGINS"]?.Split(";") ?? [];
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            }
        });
    });

    // ─── Authentication & Cookie Configuration ─────────────────────
    builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
        .AddCookie(options =>
        {
            options.Cookie.Name = "kanban_session";
            options.Cookie.HttpOnly = true;
            options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.ExpireTimeSpan = TimeSpan.FromDays(7);
            options.SlidingExpiration = true;

            if (!isDevelopment)
            {
                var cookieDomain = builder.Configuration["COOKIE_DOMAIN"];
                if (!string.IsNullOrEmpty(cookieDomain))
                {
                    options.Cookie.Domain = cookieDomain;
                }
            }

            options.Events.OnRedirectToLogin = context =>
            {
                context.Response.StatusCode = 401;
                return Task.CompletedTask;
            };
            options.Events.OnRedirectToAccessDenied = context =>
            {
                context.Response.StatusCode = 403;
                return Task.CompletedTask;
            };
        });

    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy(AuthorizationPolicies.AdminOnly, policy =>
            policy.RequireRole("admin"));

        options.AddPolicy(AuthorizationPolicies.ActiveUser, policy =>
            policy.RequireAuthenticatedUser());
    });

    // ─── Rate Limiting ─────────────────────────────────────────────
    builder.Services.AddRateLimiter(options =>
    {
        options.OnRejected = async (context, cancellationToken) =>
        {
            context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            context.HttpContext.Response.ContentType = "application/json";

            if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
            {
                context.HttpContext.Response.Headers.RetryAfter =
                    ((int)retryAfter.TotalSeconds).ToString();
            }
            else
            {
                context.HttpContext.Response.Headers.RetryAfter = "60";
            }

            await context.HttpContext.Response.WriteAsJsonAsync(
                new { message = "Too many requests. Please try again later." }, cancellationToken);
        };

        options.AddFixedWindowLimiter("auth_strict", opt =>
        {
            opt.PermitLimit = 5;
            opt.Window = TimeSpan.FromMinutes(1);
            opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            opt.QueueLimit = 0;
        });

        options.AddFixedWindowLimiter("auth_register", opt =>
        {
            opt.PermitLimit = 3;
            opt.Window = TimeSpan.FromMinutes(1);
            opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            opt.QueueLimit = 0;
        });

        options.AddSlidingWindowLimiter("api_general", opt =>
        {
            opt.PermitLimit = 100;
            opt.Window = TimeSpan.FromMinutes(1);
            opt.SegmentsPerWindow = 4;
            opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            opt.QueueLimit = 0;
        });

        options.AddSlidingWindowLimiter("api_admin", opt =>
        {
            opt.PermitLimit = 30;
            opt.Window = TimeSpan.FromMinutes(1);
            opt.SegmentsPerWindow = 4;
            opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            opt.QueueLimit = 0;
        });

        options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        {
            var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            return RateLimitPartition.GetSlidingWindowLimiter(ipAddress, _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 200,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 4,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
            });
        });
    });

    // ─── Database ──────────────────────────────────────────────────
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connectionString, npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(5),
                errorCodesToAdd: null);
        }));

    var app = builder.Build();

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            Log.Information("Applying database migrations...");
            await db.Database.MigrateAsync();
            Log.Information("Database migrations applied successfully.");
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "An error occurred while migrating the database.");
            throw;
        }
    }

    await AdminSeeder.SeedAdminAsync(app.Services, app.Configuration);

    // ─── Middleware Pipeline ───────────────────────────────────────

    app.UseSerilogRequestLogging();

    app.UseForwardedHeaders();
    app.UseExceptionHandler();
    app.UseMiddleware<CorrelationIdMiddleware>();
    app.UseMiddleware<SecurityHeadersMiddleware>();
    app.UseCors();

    // Enable static files to serve user uploads (Phase 7)
    app.UseStaticFiles();

    app.UseRateLimiter();
    app.UseMiddleware<CsrfProtectionMiddleware>();
    app.UseAuthentication();
    app.UseAuthorization();
    app.UseMiddleware<ActiveUserMiddleware>();

    // ─── Endpoints ─────────────────────────────────────────────────

    app.MapHealthChecks("/health");
    app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
    {
        Predicate = check => check.Tags.Contains("ready")
    });

    if (isDevelopment)
    {
        app.MapOpenApi();
        app.MapScalarApiReference(options =>
        {
            options.WithTitle("Kanban API");
            options.WithTheme(ScalarTheme.Mars);
        });
    }

    app.MapGet("/", () => "Kanban API is running!");

    app.MapBoardEndpoints();
    app.MapColumnEndpoints();
    app.MapTaskEndpoints();
    app.MapAuthEndpoints();
    app.MapUserEndpoints();
    app.MapAdminEndpoints();

    // Map SignalR Hub (Phase 6)
    app.MapHub<KanbanApi.Hubs.BoardHub>("/api/hubs/board");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
