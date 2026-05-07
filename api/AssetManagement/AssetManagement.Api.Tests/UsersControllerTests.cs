using AssetManagement.Api.Constants;
using AssetManagement.Api.Controllers;
using AssetManagement.Api.Dtos;
using AssetManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssetManagement.Api.Tests;

public class UsersControllerTests
{
    private static User CreateUser(int id, string role = UserRoles.User, string? email = null)
    {
        return new User
        {
            Id = id,
            Name = $"User {id}",
            Email = email ?? $"user{id}@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            Role = role
        };
    }

    [Fact]
    public async Task Delete_WhenAdminDeletesOwnAccount_ReturnsBadRequest()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.Add(CreateUser(1, UserRoles.Admin, "current.admin@example.com"));
        await context.SaveChangesAsync();

        var controller = TestSupport.CreateUsersController(context);
        TestSupport.SignIn(controller, 1, UserRoles.Admin);

        var result = await controller.Delete(1);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Delete_WhenUserHasActiveCheckout_RemovesCheckoutsAndMakesAssetAvailable()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.AddRange(
            CreateUser(1, UserRoles.Admin, "admin@example.com"),
            CreateUser(2, UserRoles.User, "regular@example.com"));
        context.Equipments.Add(new Equipment
        {
            Id = 10,
            Name = "Asset 10",
            Category = "Computer",
            SerialNumber = "SN-010",
            Status = EquipmentStatus.CheckedOut
        });
        context.Checkouts.Add(new Checkout
        {
            Id = 20,
            EquipmentId = 10,
            UserId = 2,
            CheckedOutAt = DateTime.UtcNow.AddDays(-1),
            DueAt = DateTime.UtcNow.AddDays(7)
        });
        await context.SaveChangesAsync();

        var controller = TestSupport.CreateUsersController(context);
        TestSupport.SignIn(controller, 1, UserRoles.Admin);

        var result = await controller.Delete(2);

        Assert.IsType<OkObjectResult>(result);
        Assert.False(await context.Users.AnyAsync(user => user.Id == 2));
        Assert.Empty(await context.Checkouts.ToListAsync());

        var equipment = await context.Equipments.SingleAsync(equipment => equipment.Id == 10);
        Assert.Equal(EquipmentStatus.Available, equipment.Status);
    }

    [Fact]
    public async Task Delete_WhenUserMaintainsAsset_ClearsMaintenanceAndMakesAssetAvailable()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.AddRange(
            CreateUser(1, UserRoles.Admin, "admin@example.com"),
            CreateUser(2, UserRoles.User, "regular@example.com"));
        context.Equipments.Add(new Equipment
        {
            Id = 10,
            Name = "Asset 10",
            Category = "Computer",
            SerialNumber = "SN-010",
            Status = EquipmentStatus.Maintenance,
            MaintenanceByUserId = 2
        });
        await context.SaveChangesAsync();

        var controller = TestSupport.CreateUsersController(context);
        TestSupport.SignIn(controller, 1, UserRoles.Admin);

        var result = await controller.Delete(2);

        Assert.IsType<OkObjectResult>(result);
        Assert.False(await context.Users.AnyAsync(user => user.Id == 2));

        var equipment = await context.Equipments.SingleAsync(equipment => equipment.Id == 10);
        Assert.Equal(EquipmentStatus.Available, equipment.Status);
        Assert.Null(equipment.MaintenanceByUserId);
    }

    [Fact]
    public async Task Update_WhenLastAdminRoleIsRemoved_ReturnsBadRequestAndKeepsRole()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.Add(CreateUser(1, UserRoles.Admin, "admin@example.com"));
        await context.SaveChangesAsync();

        var controller = TestSupport.CreateUsersController(context);
        TestSupport.SignIn(controller, 2, UserRoles.Admin);

        var result = await controller.Update(1, new UpdateUserDto
        {
            Name = "Admin User",
            Email = "admin@example.com",
            Role = UserRoles.User
        });

        Assert.IsType<BadRequestObjectResult>(result);

        var user = await context.Users.SingleAsync(candidate => candidate.Id == 1);
        Assert.Equal(UserRoles.Admin, user.Role);
    }

    [Fact]
    public async Task Update_WhenEmailBelongsToAnotherUser_ReturnsBadRequestAndKeepsOriginalEmail()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.AddRange(
            CreateUser(1, UserRoles.Admin, "admin@example.com"),
            CreateUser(2, UserRoles.User, "regular@example.com"));
        await context.SaveChangesAsync();

        var controller = TestSupport.CreateUsersController(context);
        TestSupport.SignIn(controller, 1, UserRoles.Admin);

        var result = await controller.Update(2, new UpdateUserDto
        {
            Name = "Regular User",
            Email = "ADMIN@example.com",
            Role = UserRoles.User
        });

        Assert.IsType<BadRequestObjectResult>(result);

        var user = await context.Users.SingleAsync(candidate => candidate.Id == 2);
        Assert.Equal("regular@example.com", user.Email);
    }

    [Fact]
    public async Task Update_WhenValidDataIsProvided_NormalizesEmailAndUpdatesUser()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.AddRange(
            CreateUser(1, UserRoles.Admin, "admin@example.com"),
            CreateUser(2, UserRoles.User, "regular@example.com"));
        await context.SaveChangesAsync();

        var controller = TestSupport.CreateUsersController(context);
        TestSupport.SignIn(controller, 1, UserRoles.Admin);

        var result = await controller.Update(2, new UpdateUserDto
        {
            Name = " Updated User ",
            Email = "UPDATED@example.com",
            Role = UserRoles.User
        });

        var okResult = Assert.IsType<OkObjectResult>(result);
        var userDto = Assert.IsType<UserSummaryDto>(okResult.Value);

        Assert.Equal("Updated User", userDto.Name);
        Assert.Equal("updated@example.com", userDto.Email);

        var user = await context.Users.SingleAsync(candidate => candidate.Id == 2);
        Assert.Equal("Updated User", user.Name);
        Assert.Equal("updated@example.com", user.Email);
    }
}
