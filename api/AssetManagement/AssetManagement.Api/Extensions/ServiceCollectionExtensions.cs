using System.Text;
using System.Threading.RateLimiting;
using AssetManagement.Api.Data;
using AssetManagement.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

namespace AssetManagement.Api.Extensions
{
    public static class ServiceCollectionExtensions
    {
        private const string JwtPlaceholderValue = "replace-with-a-long-random-secret-key";

        public static IServiceCollection AddAppDatabase(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

            return services;
        }

        public static IServiceCollection AddAppServices(this IServiceCollection services)
        {
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<ICheckoutService, CheckoutService>();
            services.AddScoped<IEquipmentImageService, EquipmentImageService>();
            services.AddScoped<IEquipmentService, EquipmentService>();
            services.AddScoped<IUserManagementService, UserManagementService>();

            return services;
        }

        public static IServiceCollection AddAppDataProtection(
            this IServiceCollection services,
            IConfiguration configuration,
            IWebHostEnvironment environment)
        {
            var configuredKeysPath = configuration["DataProtection:KeysPath"];
            var keysPath = string.IsNullOrWhiteSpace(configuredKeysPath)
                ? Path.Combine(environment.ContentRootPath, "data-protection-keys")
                : configuredKeysPath;

            Directory.CreateDirectory(keysPath);

            services.AddDataProtection()
                .PersistKeysToFileSystem(new DirectoryInfo(keysPath));

            return services;
        }

        public static IServiceCollection AddAppAuthentication(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            var jwtKey = configuration["Jwt:Key"];
            var jwtIssuer = configuration["Jwt:Issuer"];
            var jwtAudience = configuration["Jwt:Audience"];

            if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey == JwtPlaceholderValue)
            {
                throw new InvalidOperationException(
                    "Jwt:Key must be configured with a real secret value before the application starts.");
            }

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!)),
                    ClockSkew = TimeSpan.Zero
                };
                options.Events = new JwtBearerEvents
                {
                    OnTokenValidated = async context =>
                    {
                        var userIdClaim = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                        var roleClaim = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

                        if (!int.TryParse(userIdClaim, out var userId) || string.IsNullOrWhiteSpace(roleClaim))
                        {
                            context.Fail("Invalid token claims.");
                            return;
                        }

                        var dbContext = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                        var user = await dbContext.Users
                            .AsNoTracking()
                            .FirstOrDefaultAsync(candidate => candidate.Id == userId);

                        if (user == null || user.Role != roleClaim)
                        {
                            context.Fail("The token no longer matches the current user role.");
                        }
                    }
                };
            });

            return services;
        }

        public static IServiceCollection AddAppSwagger(this IServiceCollection services)
        {
            services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "Asset Management API",
                    Version = "v1"
                });

                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "Bearer <token>"
                });

                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            return services;
        }

        public static IServiceCollection AddAppCors(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            var allowedOrigins = configuration
                .GetSection("Cors:AllowedOrigins")
                .Get<string[]>()?
                .Where(origin => !string.IsNullOrWhiteSpace(origin))
                .ToArray() ?? Array.Empty<string>();

            if (allowedOrigins.Length == 0)
            {
                throw new InvalidOperationException(
                    "At least one CORS origin must be configured in Cors:AllowedOrigins.");
            }

            services.AddCors(options =>
            {
                options.AddPolicy("FrontendPolicy", policy =>
                {
                    policy.WithOrigins(allowedOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                });
            });

            return services;
        }

        public static IServiceCollection AddAppRateLimiting(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            var authRateLimitEnabled = configuration.GetValue<bool>("RateLimiting:AuthEnabled");
            var authRateLimitPermitLimit = configuration.GetValue("RateLimiting:AuthPermitLimit", 5);
            var authRateLimitWindowSeconds = configuration.GetValue("RateLimiting:AuthWindowSeconds", 60);

            services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                options.OnRejected = async (context, cancellationToken) =>
                {
                    context.HttpContext.Response.ContentType = "application/json";

                    var isLoginRequest = context.HttpContext.Request.Path.StartsWithSegments("/api/auth/login");
                    var code = isLoginRequest
                        ? "rateLimit.login"
                        : "rateLimit.generic";
                    var message = isLoginRequest
                        ? "Too many sign-in attempts. Please try again later."
                        : "Too many requests. Please try again later.";

                    await context.HttpContext.Response.WriteAsJsonAsync(
                        new { code, message },
                        cancellationToken: cancellationToken);
                };

                options.AddPolicy("AuthPolicy", httpContext =>
                {
                    if (!authRateLimitEnabled)
                    {
                        return RateLimitPartition.GetNoLimiter("auth-policy-disabled");
                    }

                    var remoteIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                    var path = httpContext.Request.Path.ToString().ToLowerInvariant();

                    return RateLimitPartition.GetFixedWindowLimiter(
                        $"{path}:{remoteIp}",
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = authRateLimitPermitLimit,
                            Window = TimeSpan.FromSeconds(authRateLimitWindowSeconds),
                            QueueLimit = 0,
                            AutoReplenishment = true
                        });
                });
            });

            return services;
        }

        public static IServiceCollection AddAppForwardedHeaders(this IServiceCollection services)
        {
            services.Configure<ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders =
                    ForwardedHeaders.XForwardedFor
                    | ForwardedHeaders.XForwardedProto
                    | ForwardedHeaders.XForwardedHost;

                options.KnownNetworks.Clear();
                options.KnownProxies.Clear();
            });

            return services;
        }
    }
}
