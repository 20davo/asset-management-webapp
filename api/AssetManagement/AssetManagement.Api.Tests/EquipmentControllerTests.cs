using AssetManagement.Api.Constants;
using AssetManagement.Api.Dtos;
using AssetManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssetManagement.Api.Tests;

public class EquipmentControllerTests
{
    private static User CreateUser(int id, string role = UserRoles.User)
    {
        return new User
        {
            Id = id,
            Name = $"User {id}",
            Email = $"user{id}@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            Role = role
        };
    }

    private static Equipment CreateEquipment(int id, string status = EquipmentStatus.Available)
    {
        return new Equipment
        {
            Id = id,
            Name = $"Asset {id}",
            Category = "Computer",
            SerialNumber = $"SN-{id:000}",
            Status = status
        };
    }

    [Fact]
    public async Task CheckoutEquipment_WhenAdminAssignsRegularUser_CreatesCheckoutAndMarksCheckedOut()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.AddRange(
            CreateUser(1, UserRoles.Admin),
            CreateUser(2));
        context.Equipments.Add(CreateEquipment(10));
        await context.SaveChangesAsync();

        var controller = TestSupport.CreateEquipmentController(context);
        TestSupport.SignIn(controller, 1, UserRoles.Admin);

        var result = await controller.CheckoutEquipment(10, new CreateCheckoutDto
        {
            AssignedUserId = 2,
            DueAt = DateTime.UtcNow.AddDays(7),
            Note = " Ready for home office "
        });

        Assert.IsType<OkObjectResult>(result);

        var checkout = await context.Checkouts.SingleAsync();
        Assert.Equal(10, checkout.EquipmentId);
        Assert.Equal(2, checkout.UserId);
        Assert.Equal("Ready for home office", checkout.Note);

        var equipment = await context.Equipments.SingleAsync(e => e.Id == 10);
        Assert.Equal(EquipmentStatus.CheckedOut, equipment.Status);
        Assert.Null(equipment.MaintenanceByUserId);
    }

    [Fact]
    public async Task CheckoutEquipment_WhenDueDateIsNotFuture_ReturnsBadRequestAndDoesNotChangeAsset()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.Add(CreateUser(1));
        context.Equipments.Add(CreateEquipment(10));
        await context.SaveChangesAsync();

        var controller = TestSupport.CreateEquipmentController(context);
        TestSupport.SignIn(controller, 1, UserRoles.User);

        var result = await controller.CheckoutEquipment(10, new CreateCheckoutDto
        {
            DueAt = DateTime.UtcNow.AddMinutes(-1)
        });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(await context.Checkouts.ToListAsync());

        var equipment = await context.Equipments.SingleAsync(e => e.Id == 10);
        Assert.Equal(EquipmentStatus.Available, equipment.Status);
    }

    [Fact]
    public async Task CheckoutEquipment_WhenRegularUserChecksOutAvailableAsset_CreatesCheckoutForCurrentUser()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.Add(CreateUser(1));
        context.Equipments.Add(CreateEquipment(10));
        await context.SaveChangesAsync();

        var controller = TestSupport.CreateEquipmentController(context);
        TestSupport.SignIn(controller, 1, UserRoles.User);

        var result = await controller.CheckoutEquipment(10, new CreateCheckoutDto
        {
            AssignedUserId = 999,
            DueAt = DateTime.UtcNow.AddDays(7)
        });

        Assert.IsType<OkObjectResult>(result);

        var checkout = await context.Checkouts.SingleAsync();
        Assert.Equal(1, checkout.UserId);
        Assert.Equal(10, checkout.EquipmentId);

        var equipment = await context.Equipments.SingleAsync(e => e.Id == 10);
        Assert.Equal(EquipmentStatus.CheckedOut, equipment.Status);
    }

    [Fact]
    public async Task CheckoutEquipment_WhenAssetIsInMaintenance_ReturnsBadRequestAndDoesNotCreateCheckout()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.Add(CreateUser(1));
        context.Equipments.Add(CreateEquipment(10, EquipmentStatus.Maintenance));
        await context.SaveChangesAsync();

        var controller = TestSupport.CreateEquipmentController(context);
        TestSupport.SignIn(controller, 1, UserRoles.User);

        var result = await controller.CheckoutEquipment(10, new CreateCheckoutDto
        {
            DueAt = DateTime.UtcNow.AddDays(7)
        });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(await context.Checkouts.ToListAsync());

        var equipment = await context.Equipments.SingleAsync(e => e.Id == 10);
        Assert.Equal(EquipmentStatus.Maintenance, equipment.Status);
    }

    [Fact]
    public async Task CheckoutEquipment_WhenAdminAssignsToSelf_ReturnsBadRequest()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.Add(CreateUser(1, UserRoles.Admin));
        context.Equipments.Add(CreateEquipment(10));
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
            CreateUser(1),
            CreateUser(2));
        context.Equipments.Add(CreateEquipment(10, EquipmentStatus.CheckedOut));
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

    [Fact]
    public async Task ReturnEquipment_WhenAdminReturnsAnyActiveCheckout_MarksCheckoutReturnedAndAssetAvailable()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.AddRange(
            CreateUser(1),
            CreateUser(2, UserRoles.Admin));
        context.Equipments.Add(CreateEquipment(10, EquipmentStatus.CheckedOut));
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
        TestSupport.SignIn(controller, 2, UserRoles.Admin);

        var result = await controller.ReturnEquipment(10, new ReturnCheckoutDto());

        Assert.IsType<OkObjectResult>(result);

        var checkout = await context.Checkouts.SingleAsync();
        Assert.NotNull(checkout.ReturnedAt);

        var equipment = await context.Equipments.SingleAsync(e => e.Id == 10);
        Assert.Equal(EquipmentStatus.Available, equipment.Status);
    }

    [Fact]
    public async Task ReturnEquipment_WhenOwnerReturnsAsset_MarksCheckoutReturnedAndAssetAvailable()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.Add(CreateUser(1));
        context.Equipments.Add(CreateEquipment(10, EquipmentStatus.CheckedOut));
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
        TestSupport.SignIn(controller, 1, UserRoles.User);

        var result = await controller.ReturnEquipment(10, new ReturnCheckoutDto
        {
            Note = " Returned in good condition "
        });

        Assert.IsType<OkObjectResult>(result);

        var checkout = await context.Checkouts.SingleAsync();
        Assert.NotNull(checkout.ReturnedAt);
        Assert.Equal("Returned in good condition", checkout.Note);

        var equipment = await context.Equipments.SingleAsync(e => e.Id == 10);
        Assert.Equal(EquipmentStatus.Available, equipment.Status);
        Assert.Null(equipment.MaintenanceByUserId);
    }

    [Fact]
    public async Task MarkMaintenance_WhenAssetIsCheckedOut_ReturnsBadRequestAndKeepsStatus()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.Add(CreateUser(1, UserRoles.Admin));
        context.Equipments.Add(CreateEquipment(10, EquipmentStatus.CheckedOut));
        await context.SaveChangesAsync();

        var controller = TestSupport.CreateEquipmentController(context);
        TestSupport.SignIn(controller, 1, UserRoles.Admin);

        var result = await controller.MarkMaintenance(10);

        Assert.IsType<BadRequestObjectResult>(result);

        var equipment = await context.Equipments.SingleAsync(e => e.Id == 10);
        Assert.Equal(EquipmentStatus.CheckedOut, equipment.Status);
        Assert.Null(equipment.MaintenanceByUserId);
    }

    [Fact]
    public async Task MarkMaintenance_WhenAssetIsAvailable_MarksMaintenanceAndStoresAdmin()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.Add(CreateUser(1, UserRoles.Admin));
        context.Equipments.Add(CreateEquipment(10));
        await context.SaveChangesAsync();

        var controller = TestSupport.CreateEquipmentController(context);
        TestSupport.SignIn(controller, 1, UserRoles.Admin);

        var result = await controller.MarkMaintenance(10);

        Assert.IsType<OkObjectResult>(result);

        var equipment = await context.Equipments.SingleAsync(e => e.Id == 10);
        Assert.Equal(EquipmentStatus.Maintenance, equipment.Status);
        Assert.Equal(1, equipment.MaintenanceByUserId);
    }

    [Fact]
    public async Task MarkAvailable_WhenAssetIsInMaintenance_MarksAvailableAndClearsMaintenanceUser()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.Add(CreateUser(1, UserRoles.Admin));
        context.Equipments.Add(new Equipment
        {
            Id = 10,
            Name = "Asset 10",
            Category = "Computer",
            SerialNumber = "SN-010",
            Status = EquipmentStatus.Maintenance,
            MaintenanceByUserId = 1
        });
        await context.SaveChangesAsync();

        var controller = TestSupport.CreateEquipmentController(context);
        TestSupport.SignIn(controller, 1, UserRoles.Admin);

        var result = await controller.MarkAvailable(10);

        Assert.IsType<OkObjectResult>(result);

        var equipment = await context.Equipments.SingleAsync(e => e.Id == 10);
        Assert.Equal(EquipmentStatus.Available, equipment.Status);
        Assert.Null(equipment.MaintenanceByUserId);
    }
}
