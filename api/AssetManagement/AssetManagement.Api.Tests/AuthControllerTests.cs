using AssetManagement.Api.Controllers;
using AssetManagement.Api.Dtos;
using AssetManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssetManagement.Api.Tests;

public class AuthControllerTests
{
    [Fact]
    public async Task Register_WhenRegistrationIsDisabled_ReturnsForbidden()
    {
        await using var context = TestSupport.CreateDbContext();
        var configuration = TestSupport.CreateConfiguration(
            new KeyValuePair<string, string?>("Registration:Enabled", "false"));
        var controller = TestSupport.CreateAuthController(context, configuration);

        var result = await controller.Register(new RegisterDto
        {
            Name = "Test User",
            Email = "test.user@example.com",
            Password = "Password123!"
        });

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(403, objectResult.StatusCode);
        Assert.Empty(await context.Users.ToListAsync());
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ReturnsBadRequest()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.Add(new User
        {
            Name = "Existing User",
            Email = "duplicate@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!")
        });
        await context.SaveChangesAsync();

        var configuration = TestSupport.CreateConfiguration(
            new KeyValuePair<string, string?>("Registration:Enabled", "true"));
        var controller = TestSupport.CreateAuthController(context, configuration);

        var result = await controller.Register(new RegisterDto
        {
            Name = "New User",
            Email = "DUPLICATE@example.com",
            Password = "Password123!"
        });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Single(await context.Users.ToListAsync());
    }
}
