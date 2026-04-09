using System.Text;
using AssetManagement.Api.Data;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using AssetManagement.Api.Constants;
using AssetManagement.Api.Models;

namespace AssetManagement.Api
{
    public class Program
    {
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

            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();

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

                var adminExists = context.Users.Any(u => u.Role == UserRoles.Admin);

                if (!adminExists)
                {
                    var adminUser = new User
                    {
                        Name = "Admin",
                        Email = "admin@assetmanagement.local",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                        Role = UserRoles.Admin
                    };

                    context.Users.Add(adminUser);
                    context.SaveChanges();
                }
            }

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            var httpsRedirectEnabled = builder.Configuration.GetValue<bool>("HttpsRedirection:Enabled");

            if (httpsRedirectEnabled)
            {
                app.UseHttpsRedirection();
            }

            app.UseStaticFiles();

            app.UseCors("FrontendPolicy");

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}
