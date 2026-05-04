using AssetManagement.Api.Constants;
using AssetManagement.Api.Controllers;
using AssetManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace AssetManagement.Api.Tests;

public class UsersControllerTests
{
    [Fact]
    public async Task Delete_WhenAdminDeletesOwnAccount_ReturnsBadRequest()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.Add(new User
        {
            Id = 1,
            Name = "Current Admin",
            Email = "current.admin@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            Role = UserRoles.Admin
        });
        await context.SaveChangesAsync();

        var controller = new UsersController(context);
        TestSupport.SignIn(controller, 1, UserRoles.Admin);

        var result = await controller.Delete(1);

        Assert.IsType<BadRequestObjectResult>(result);
    }
}
