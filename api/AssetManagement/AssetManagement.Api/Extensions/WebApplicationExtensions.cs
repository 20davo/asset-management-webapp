using AssetManagement.Api.Constants;
using AssetManagement.Api.Data;
using AssetManagement.Api.Models;
using AssetManagement.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace AssetManagement.Api.Extensions
{
    public static class WebApplicationExtensions
    {
        public static void EnsureEquipmentUploadDirectory(this WebApplication app)
        {
            using var scope = app.Services.CreateScope();
            var imageService = scope.ServiceProvider.GetRequiredService<IEquipmentImageService>();

            imageService.EnsureUploadDirectoryExists();
        }

        public static void ApplyMigrationsAndBootstrapAdmin(this WebApplication app)
        {
            using var scope = app.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            context.Database.Migrate();

            var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

            if (!configuration.GetValue<bool>("BootstrapAdmin:Enabled"))
            {
                return;
            }

            var bootstrapAdminName = configuration["BootstrapAdmin:Name"]?.Trim();
            var bootstrapAdminEmail = configuration["BootstrapAdmin:Email"]?.Trim().ToLowerInvariant();
            var bootstrapAdminPassword = configuration["BootstrapAdmin:Password"];

            if (string.IsNullOrWhiteSpace(bootstrapAdminName)
                || string.IsNullOrWhiteSpace(bootstrapAdminEmail)
                || string.IsNullOrWhiteSpace(bootstrapAdminPassword))
            {
                throw new InvalidOperationException(
                    "BootstrapAdmin is enabled, but Name, Email, or Password is missing.");
            }

            var adminExists = context.Users.Any(user => user.Role == UserRoles.Admin);

            if (adminExists)
            {
                return;
            }

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
