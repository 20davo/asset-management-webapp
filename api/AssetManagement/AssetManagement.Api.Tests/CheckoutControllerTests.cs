using AssetManagement.Api.Constants;
using AssetManagement.Api.Controllers;
using AssetManagement.Api.Dtos;
using AssetManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace AssetManagement.Api.Tests;

public class CheckoutControllerTests
{
    private static User CreateUser(int id)
    {
        return new User
        {
            Id = id,
            Name = $"User {id}",
            Email = $"user{id}@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            Role = UserRoles.User
        };
    }

    private static Equipment CreateEquipment(int id)
    {
        return new Equipment
        {
            Id = id,
            Name = $"Asset {id}",
            Category = "Computer",
            SerialNumber = $"SN-{id:000}",
            Status = EquipmentStatus.CheckedOut
        };
    }

    [Fact]
    public async Task GetMyCheckouts_ReturnsOnlySignedInUsersAssignments()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.AddRange(CreateUser(1), CreateUser(2));
        context.Equipments.AddRange(CreateEquipment(10), CreateEquipment(11));
        context.Checkouts.AddRange(
            new Checkout
            {
                Id = 20,
                EquipmentId = 10,
                UserId = 1,
                CheckedOutAt = DateTime.UtcNow.AddDays(-1),
                DueAt = DateTime.UtcNow.AddDays(7)
            },
            new Checkout
            {
                Id = 21,
                EquipmentId = 11,
                UserId = 2,
                CheckedOutAt = DateTime.UtcNow.AddDays(-2),
                DueAt = DateTime.UtcNow.AddDays(8)
            });
        await context.SaveChangesAsync();

        var controller = new CheckoutController(context);
        TestSupport.SignIn(controller, 1, UserRoles.User);

        var result = await controller.GetMyCheckouts();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var checkouts = Assert.IsAssignableFrom<IEnumerable<CheckoutResponseDto>>(okResult.Value).ToList();

        Assert.Single(checkouts);
        Assert.Equal(20, checkouts[0].Id);
        Assert.Equal(1, checkouts[0].User.Id);
        Assert.Equal(10, checkouts[0].Equipment.Id);
    }

    [Fact]
    public async Task GetByUser_WhenUserDoesNotExist_ReturnsNotFound()
    {
        await using var context = TestSupport.CreateDbContext();

        var controller = new CheckoutController(context);
        TestSupport.SignIn(controller, 1, UserRoles.Admin);

        var result = await controller.GetByUser(404);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }
}
