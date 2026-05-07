using AssetManagement.Api.Extensions;

namespace AssetManagement.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services
                .AddAppDatabase(builder.Configuration)
                .AddAppServices()
                .AddAppDataProtection(builder.Configuration, builder.Environment)
                .AddAppAuthentication(builder.Configuration)
                .AddAppSwagger()
                .AddAppCors(builder.Configuration)
                .AddAppRateLimiting(builder.Configuration)
                .AddAppForwardedHeaders();

            builder.Services.AddAuthorization();
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();

            var app = builder.Build();

            app.EnsureEquipmentUploadDirectory();
            app.ApplyMigrationsAndBootstrapAdmin();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            if (builder.Configuration.GetValue<bool>("ForwardedHeaders:Enabled"))
            {
                app.UseForwardedHeaders();
            }

            if (builder.Configuration.GetValue<bool>("HttpsRedirection:Enabled"))
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
