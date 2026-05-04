using AssetManagement.Api.Constants;
using AssetManagement.Api.Dtos;
using AssetManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssetManagement.Api.Tests;

public class EquipmentControllerTests
{
    [Fact]
    public async Task CheckoutEquipment_WhenAdminAssignsToSelf_ReturnsBadRequest()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.Add(new User
        {
            Id = 1,
            Name = "Admin User",
            Email = "admin@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            Role = UserRoles.Admin
        });
        context.Equipments.Add(new Equipment
        {
            Id = 10,
            Name = "Laptop",
            Category = "Computer",
            SerialNumber = "SN-001",
            Status = EquipmentStatus.Available
        });
        await context.SaveChangesAsync();

        var controller = TestSupport.CreateEquipmentController(context);
        TestSupport.SignIn(controller, 1, UserRoles.Admin);

        var result = await controller.CheckoutEquipment(10, new CreateCheckoutDto
        {
            AssignedUserId = 1,
            DueAt = DateTime.UtcNow.AddDays(7)
        });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(await context.Checkouts.ToListAsync());
    }

    [Fact]
    public async Task ReturnEquipment_WhenDifferentRegularUserReturnsAsset_ReturnsForbidden()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.AddRange(
            new User
            {
                Id = 1,
                Name = "Owner User",
                Email = "owner@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
                Role = UserRoles.User
            },
            new User
            {
                Id = 2,
                Name = "Other User",
                Email = "other@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
                Role = UserRoles.User
            });
        context.Equipments.Add(new Equipment
        {
            Id = 10,
            Name = "Laptop",
            Category = "Computer",
            SerialNumber = "SN-001",
            Status = EquipmentStatus.CheckedOut
        });
        context.Checkouts.Add(new Checkout
        {
            Id = 20,
            EquipmentId = 10,
            UserId = 1,
            CheckedOutAt = DateTime.UtcNow.AddDays(-1),
            DueAt = DateTime.UtcNow.AddDays(7)
        });
        await context.SaveChangesAsync();

        var controller = TestSupport.CreateEquipmentController(context);
        TestSupport.SignIn(controller, 2, UserRoles.User);

        var result = await controller.ReturnEquipment(10, new ReturnCheckoutDto());

        Assert.IsType<ForbidResult>(result);
        var checkout = await context.Checkouts.SingleAsync();
        Assert.Null(checkout.ReturnedAt);
    }
}
