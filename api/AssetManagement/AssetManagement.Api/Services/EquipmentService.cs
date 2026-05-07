using System.Security.Claims;
using AssetManagement.Api.Constants;
using AssetManagement.Api.Data;
using AssetManagement.Api.Dtos;
using AssetManagement.Api.Mappings;
using AssetManagement.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AssetManagement.Api.Services
{
    public interface IEquipmentService
    {
        Task<List<EquipmentListItemDto>> GetAllAsync(ClaimsPrincipal user);
        Task<EquipmentDetailsDto?> GetByIdAsync(int id, ClaimsPrincipal user);
        Task<ServiceResult> CreateAsync(CreateEquipmentDto dto);
        Task<ServiceResult> UpdateAsync(int id, UpdateEquipmentDto dto);
        Task<ServiceResult> DeleteAsync(int id);
        Task<ServiceResult> CheckoutAsync(int id, CreateCheckoutDto dto, ClaimsPrincipal user);
        Task<ServiceResult> ReturnAsync(int id, ReturnCheckoutDto dto, ClaimsPrincipal user);
        Task<ServiceResult> MarkMaintenanceAsync(int id, ClaimsPrincipal user);
        Task<ServiceResult> MarkAvailableAsync(int id);
    }

    public class EquipmentService : IEquipmentService
    {
        private readonly AppDbContext _context;
        private readonly IEquipmentImageService _imageService;

        public EquipmentService(AppDbContext context, IEquipmentImageService imageService)
        {
            _context = context;
            _imageService = imageService;
        }

        public async Task<List<EquipmentListItemDto>> GetAllAsync(ClaimsPrincipal user)
        {
            var isAdmin = user.FindFirst(ClaimTypes.Role)?.Value == UserRoles.Admin;

            return await _context.Equipments
                .OrderBy(equipment => equipment.Name)
                .Select(equipment => new EquipmentListItemDto
                {
                    Id = equipment.Id,
                    Name = equipment.Name,
                    Category = equipment.Category,
                    Description = equipment.Description,
                    ImageUrl = equipment.ImageUrl,
                    SerialNumber = equipment.SerialNumber,
                    Status = equipment.Status,
                    CreatedAt = equipment.CreatedAt,
                    ActiveCheckoutUserName = equipment.Checkouts
                        .Where(checkout => checkout.ReturnedAt == null)
                        .OrderByDescending(checkout => checkout.CheckedOutAt)
                        .Select(checkout => checkout.User != null ? checkout.User.Name : null)
                        .FirstOrDefault(),
                    ActiveCheckoutDueAt = equipment.Checkouts
                        .Where(checkout => checkout.ReturnedAt == null)
                        .OrderByDescending(checkout => checkout.CheckedOutAt)
                        .Select(checkout => (DateTime?)checkout.DueAt)
                        .FirstOrDefault(),
                    MaintenanceByUserName = isAdmin && equipment.MaintenanceByUser != null
                        ? equipment.MaintenanceByUser.Name
                        : null
                })
                .ToListAsync();
        }

        public async Task<EquipmentDetailsDto?> GetByIdAsync(int id, ClaimsPrincipal user)
        {
            var equipment = await _context.Equipments
                .Include(e => e.Checkouts)
                    .ThenInclude(c => c.User)
                .FirstOrDefaultAsync(equipment => equipment.Id == id);

            if (equipment == null)
            {
                return null;
            }

            var isAdmin = user.FindFirst(ClaimTypes.Role)?.Value == UserRoles.Admin;
            var hasCurrentUserId = int.TryParse(
                user.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                out var currentUserId);

            return equipment.ToDetailsDto(isAdmin, hasCurrentUserId ? currentUserId : null);
        }

        public async Task<ServiceResult> CreateAsync(CreateEquipmentDto dto)
        {
            var imageValidationResult = await _imageService.ValidateImageAsync(dto.Image);

            if (imageValidationResult != null)
            {
                return imageValidationResult;
            }

            var normalizedSerialNumber = dto.SerialNumber.Trim();
            var serialExists = await _context.Equipments
                .AnyAsync(equipment => equipment.SerialNumber == normalizedSerialNumber);

            if (serialExists)
            {
                return ServiceResult.BadRequest("equipment.serialAlreadyExists", "An asset with this serial number already exists.");
            }

            var equipment = new Equipment
            {
                Name = dto.Name.Trim(),
                Category = dto.Category.Trim(),
                Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
                ImageUrl = await _imageService.SaveImageAsync(dto.Image),
                SerialNumber = normalizedSerialNumber,
                Status = EquipmentStatus.Available,
                CreatedAt = DateTime.UtcNow
            };

            _context.Equipments.Add(equipment);
            await _context.SaveChangesAsync();

            return ServiceResult.Created(
                "equipment.created",
                "Asset created successfully.",
                equipment,
                new { id = equipment.Id });
        }

        public async Task<ServiceResult> UpdateAsync(int id, UpdateEquipmentDto dto)
        {
            var imageValidationResult = await _imageService.ValidateImageAsync(dto.Image);

            if (imageValidationResult != null)
            {
                return imageValidationResult;
            }

            var equipment = await _context.Equipments.FindAsync(id);

            if (equipment == null)
            {
                return ServiceResult.NotFound("equipment.notFound", "Asset not found.");
            }

            var normalizedSerialNumber = dto.SerialNumber.Trim();
            var serialExists = await _context.Equipments
                .AnyAsync(candidate => candidate.SerialNumber == normalizedSerialNumber && candidate.Id != id);

            if (serialExists)
            {
                return ServiceResult.BadRequest("equipment.serialUsedByOtherAsset", "Another asset already uses this serial number.");
            }

            var previousImageUrl = equipment.ImageUrl;
            var nextImageUrl = previousImageUrl;

            if (dto.Image != null)
            {
                nextImageUrl = await _imageService.SaveImageAsync(dto.Image);
            }
            else if (dto.RemoveImage)
            {
                nextImageUrl = null;
            }

            equipment.Name = dto.Name.Trim();
            equipment.Category = dto.Category.Trim();
            equipment.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
            equipment.ImageUrl = nextImageUrl;
            equipment.SerialNumber = normalizedSerialNumber;

            await _context.SaveChangesAsync();

            if (dto.Image != null || (dto.RemoveImage && dto.Image == null))
            {
                _imageService.DeleteImageFile(previousImageUrl);
            }

            return ServiceResult.Success(
                "equipment.updated",
                "Asset updated successfully.",
                new { equipmentId = equipment.Id });
        }

        public async Task<ServiceResult> DeleteAsync(int id)
        {
            var equipment = await _context.Equipments.FindAsync(id);

            if (equipment == null)
            {
                return ServiceResult.NotFound("equipment.notFound", "Asset not found.");
            }

            var hasActiveCheckout = await _context.Checkouts
                .AnyAsync(checkout => checkout.EquipmentId == id && checkout.ReturnedAt == null);

            if (hasActiveCheckout)
            {
                return ServiceResult.BadRequest("equipment.deleteActiveCheckoutBlocked", "This asset cannot be deleted while it is checked out.");
            }

            _imageService.DeleteImageFile(equipment.ImageUrl);
            _context.Equipments.Remove(equipment);
            await _context.SaveChangesAsync();

            return ServiceResult.Success(
                "equipment.deleted",
                "Asset deleted successfully.",
                new { equipmentId = id });
        }

        public async Task<ServiceResult> CheckoutAsync(int id, CreateCheckoutDto dto, ClaimsPrincipal user)
        {
            var equipment = await _context.Equipments.FindAsync(id);

            if (equipment == null)
            {
                return ServiceResult.NotFound("equipment.notFound", "Asset not found.");
            }

            if (!TryGetCurrentUserId(user, out var userId))
            {
                return ServiceResult.Unauthorized("auth.invalidTokenUser", "The signed-in user could not be identified.");
            }

            var isAdmin = user.FindFirst(ClaimTypes.Role)?.Value == UserRoles.Admin;

            if (dto.DueAt <= DateTime.UtcNow)
            {
                return ServiceResult.BadRequest("equipment.dueDateMustBeFuture", "The due date must be in the future.");
            }

            if (equipment.Status != EquipmentStatus.Available)
            {
                return ServiceResult.BadRequest("equipment.notAvailableForCheckout", "This asset is not currently available for assignment.");
            }

            var targetUserId = userId;

            if (isAdmin)
            {
                var assignmentResult = await ResolveAssignedUserIdAsync(dto.AssignedUserId, userId);

                if (assignmentResult.Result != null)
                {
                    return assignmentResult.Result;
                }

                targetUserId = assignmentResult.UserId!.Value;
            }

            var checkout = new Checkout
            {
                EquipmentId = equipment.Id,
                UserId = targetUserId,
                DueAt = dto.DueAt,
                Note = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note.Trim(),
                CheckedOutAt = DateTime.UtcNow
            };

            _context.Checkouts.Add(checkout);

            equipment.Status = EquipmentStatus.CheckedOut;
            equipment.MaintenanceByUserId = null;

            await _context.SaveChangesAsync();

            return ServiceResult.Success(
                isAdmin ? "equipment.assigned" : "equipment.checkedOut",
                isAdmin ? "Asset assigned successfully." : "Asset checked out successfully.",
                new
                {
                    equipmentId = equipment.Id,
                    checkoutId = checkout.Id
                });
        }

        public async Task<ServiceResult> ReturnAsync(int id, ReturnCheckoutDto dto, ClaimsPrincipal user)
        {
            var equipment = await _context.Equipments.FindAsync(id);

            if (equipment == null)
            {
                return ServiceResult.NotFound("equipment.notFound", "Asset not found.");
            }

            var activeCheckout = await _context.Checkouts
                .Where(checkout => checkout.EquipmentId == id && checkout.ReturnedAt == null)
                .OrderByDescending(checkout => checkout.CheckedOutAt)
                .FirstOrDefaultAsync();

            if (activeCheckout == null)
            {
                return ServiceResult.BadRequest("equipment.noActiveCheckout", "This asset has no active assignment.");
            }

            if (!TryGetCurrentUserId(user, out var userId))
            {
                return ServiceResult.Unauthorized("auth.invalidTokenUser", "The signed-in user could not be identified.");
            }

            var isAdmin = user.FindFirst(ClaimTypes.Role)?.Value == UserRoles.Admin;
            var isOwner = activeCheckout.UserId == userId;

            if (!isAdmin && !isOwner)
            {
                return ServiceResult.Forbidden();
            }

            activeCheckout.ReturnedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(dto.Note))
            {
                activeCheckout.Note = dto.Note.Trim();
            }

            equipment.Status = EquipmentStatus.Available;
            equipment.MaintenanceByUserId = null;

            await _context.SaveChangesAsync();

            return ServiceResult.Success(
                "equipment.returned",
                "Asset returned successfully.",
                new
                {
                    equipmentId = equipment.Id,
                    checkoutId = activeCheckout.Id
                });
        }

        public async Task<ServiceResult> MarkMaintenanceAsync(int id, ClaimsPrincipal user)
        {
            var equipment = await _context.Equipments.FindAsync(id);

            if (equipment == null)
            {
                return ServiceResult.NotFound("equipment.notFound", "Asset not found.");
            }

            if (equipment.Status == EquipmentStatus.CheckedOut)
            {
                return ServiceResult.BadRequest("equipment.maintenanceCheckedOutBlocked", "A checked-out asset cannot be moved to maintenance.");
            }

            if (equipment.Status == EquipmentStatus.Maintenance)
            {
                return ServiceResult.BadRequest("equipment.maintenanceAlready", "This asset is already in maintenance.");
            }

            if (!TryGetCurrentUserId(user, out var userId))
            {
                return ServiceResult.Unauthorized("auth.invalidTokenUser", "The signed-in user could not be identified.");
            }

            equipment.Status = EquipmentStatus.Maintenance;
            equipment.MaintenanceByUserId = userId;
            await _context.SaveChangesAsync();

            return ServiceResult.Success(
                "equipment.maintenanceMarked",
                "Asset moved to maintenance.",
                new { equipmentId = equipment.Id });
        }

        public async Task<ServiceResult> MarkAvailableAsync(int id)
        {
            var equipment = await _context.Equipments.FindAsync(id);

            if (equipment == null)
            {
                return ServiceResult.NotFound("equipment.notFound", "Asset not found.");
            }

            if (equipment.Status != EquipmentStatus.Maintenance)
            {
                return ServiceResult.BadRequest("equipment.availableRequiresMaintenance", "Only assets in maintenance can be marked as available.");
            }

            equipment.Status = EquipmentStatus.Available;
            equipment.MaintenanceByUserId = null;
            await _context.SaveChangesAsync();

            return ServiceResult.Success(
                "equipment.availableMarked",
                "Asset is available again.",
                new { equipmentId = equipment.Id });
        }

        private async Task<(ServiceResult? Result, int? UserId)> ResolveAssignedUserIdAsync(
            int? assignedUserId,
            int currentUserId)
        {
            if (!assignedUserId.HasValue)
            {
                return (ServiceResult.BadRequest("equipment.adminAssignmentUserRequired", "Select the user who should receive this asset."), null);
            }

            if (assignedUserId.Value == currentUserId)
            {
                return (ServiceResult.BadRequest("equipment.adminSelfAssignmentBlocked", "Admins cannot assign an asset to themselves."), null);
            }

            var assignedUser = await _context.Users
                .FirstOrDefaultAsync(user => user.Id == assignedUserId.Value);

            if (assignedUser == null)
            {
                return (ServiceResult.BadRequest("equipment.assignedUserNotFound", "The selected user was not found."), null);
            }

            if (assignedUser.Role != UserRoles.User)
            {
                return (ServiceResult.BadRequest("equipment.assignOnlyRegularUser", "Assets can only be assigned to regular users."), null);
            }

            return (null, assignedUser.Id);
        }

        private static bool TryGetCurrentUserId(ClaimsPrincipal user, out int userId)
        {
            return int.TryParse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value, out userId);
        }
    }
}
