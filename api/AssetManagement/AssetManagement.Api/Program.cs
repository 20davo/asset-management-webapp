using System.Text;
using System.Threading.RateLimiting;
using AssetManagement.Api.Data;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using AssetManagement.Api.Constants;
using AssetManagement.Api.Models;

namespace AssetManagement.Api
{
    public class Program
    {
        private const string JwtPlaceholderValue = "replace-with-a-long-random-secret-key";

        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

            var jwtKey = builder.Configuration["Jwt:Key"];
            var jwtIssuer = builder.Configuration["Jwt:Issuer"];
            var jwtAudience = builder.Configuration["Jwt:Audience"];
            var configuredDataProtectionKeysPath = builder.Configuration["DataProtection:KeysPath"];
            var dataProtectionKeysPath = string.IsNullOrWhiteSpace(configuredDataProtectionKeysPath)
                ? Path.Combine(builder.Environment.ContentRootPath, "data-protection-keys")
                : configuredDataProtectionKeysPath;
            var authRateLimitEnabled = builder.Configuration.GetValue<bool>("RateLimiting:AuthEnabled");
            var authRateLimitPermitLimit = builder.Configuration.GetValue("RateLimiting:AuthPermitLimit", 5);
            var authRateLimitWindowSeconds = builder.Configuration.GetValue("RateLimiting:AuthWindowSeconds", 60);

            if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey == JwtPlaceholderValue)
            {
                throw new InvalidOperationException(
                    "Jwt:Key must be configured with a real secret value before the application starts.");
            }

            Directory.CreateDirectory(dataProtectionKeysPath);

            builder.Services.AddDataProtection()
                .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysPath));

            builder.Services.AddAuthentication(options =>
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
            });

            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddSwaggerGen(options =>
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

            var allowedOrigins = builder.Configuration
                .GetSection("Cors:AllowedOrigins")
                .Get<string[]>()?
                .Where(origin => !string.IsNullOrWhiteSpace(origin))
                .ToArray() ?? Array.Empty<string>();

            if (allowedOrigins.Length == 0)
            {
                throw new InvalidOperationException(
                    "At least one CORS origin must be configured in Cors:AllowedOrigins.");
            }

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("FrontendPolicy", policy =>
                {
                    policy.WithOrigins(allowedOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                });
            });

            builder.Services.AddAuthorization();
            builder.Services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                options.OnRejected = async (context, cancellationToken) =>
                {
                    context.HttpContext.Response.ContentType = "application/json";

                    var message = context.HttpContext.Request.Path.StartsWithSegments("/api/auth/login")
                        ? "Túl sok bejelentkezési próbálkozás. Próbáld újra később."
                        : "Túl sok kérés. Próbáld újra később.";

                    await context.HttpContext.Response.WriteAsJsonAsync(
                        new { message },
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

            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.Configure<ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders =
                    ForwardedHeaders.XForwardedFor
                    | ForwardedHeaders.XForwardedProto
                    | ForwardedHeaders.XForwardedHost;

                // The reverse proxy lives on the Docker network in the production-like stack,
                // so we allow forwarded headers from non-loopback sources when explicitly enabled.
                options.KnownNetworks.Clear();
                options.KnownProxies.Clear();
            });

            var app = builder.Build();

            var webRootPath = app.Environment.WebRootPath;

            if (string.IsNullOrWhiteSpace(webRootPath))
            {
                webRootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
            }

            Directory.CreateDirectory(Path.Combine(webRootPath, "uploads", "equipment"));

            using (var scope = app.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                context.Database.Migrate();

                var bootstrapAdminEnabled = builder.Configuration.GetValue<bool>("BootstrapAdmin:Enabled");

                if (bootstrapAdminEnabled)
                {
                    var bootstrapAdminName = builder.Configuration["BootstrapAdmin:Name"]?.Trim();
                    var bootstrapAdminEmail = builder.Configuration["BootstrapAdmin:Email"]?.Trim().ToLowerInvariant();
                    var bootstrapAdminPassword = builder.Configuration["BootstrapAdmin:Password"];

                    if (string.IsNullOrWhiteSpace(bootstrapAdminName)
                        || string.IsNullOrWhiteSpace(bootstrapAdminEmail)
                        || string.IsNullOrWhiteSpace(bootstrapAdminPassword))
                    {
                        throw new InvalidOperationException(
                            "BootstrapAdmin is enabled, but Name, Email, or Password is missing.");
                    }

                    var adminExists = context.Users.Any(u => u.Role == UserRoles.Admin);

                    if (!adminExists)
                    {
                        var adminUser = new User
                        {
                            Name = bootstrapAdminName,
                            Email = bootstrapAdminEmail,
                            PasswordHash = BCrypt.Net.BCrypt.HashPassword(bootstrapAdminPassword),
                            Role = UserRoles.Admin
                        };

                        context.Users.Add(adminUser);
                        context.SaveChanges();
                    }
                }
            }

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            var forwardedHeadersEnabled = builder.Configuration.GetValue<bool>("ForwardedHeaders:Enabled");

            if (forwardedHeadersEnabled)
            {
                app.UseForwardedHeaders();
            }

            var httpsRedirectEnabled = builder.Configuration.GetValue<bool>("HttpsRedirection:Enabled");

            if (httpsRedirectEnabled)
            {
                app.UseHttpsRedirection();
            }

            app.UseCors("FrontendPolicy");

            app.UseRateLimiter();
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}


