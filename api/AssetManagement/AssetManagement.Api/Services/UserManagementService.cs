using System.Net.Mail;
using System.Security.Claims;
using AssetManagement.Api.Constants;
using AssetManagement.Api.Data;
using AssetManagement.Api.Dtos;
using AssetManagement.Api.Mappings;
using Microsoft.EntityFrameworkCore;

namespace AssetManagement.Api.Services
{
    public interface IUserManagementService
    {
        Task<List<UserSummaryDto>> GetAllAsync();
        Task<UserSummaryDto?> GetByIdAsync(int id);
        Task<ServiceResult> UpdateAsync(int id, UpdateUserDto dto, ClaimsPrincipal user);
        Task<ServiceResult> DeleteAsync(int id, ClaimsPrincipal user);
    }

    public class UserManagementService : IUserManagementService
    {
        private readonly AppDbContext _context;

        public UserManagementService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<UserSummaryDto>> GetAllAsync()
        {
            return await _context.Users
                .OrderBy(user => user.Name)
                .Select(user => user.ToSummaryDto())
                .ToListAsync();
        }

        public async Task<UserSummaryDto?> GetByIdAsync(int id)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(candidate => candidate.Id == id);

            return user?.ToSummaryDto();
        }

        public async Task<ServiceResult> UpdateAsync(int id, UpdateUserDto dto, ClaimsPrincipal userPrincipal)
        {
            var hasCurrentAdminId = int.TryParse(
                userPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                out var currentAdminId);
            var normalizedName = dto.Name.Trim();
            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            var normalizedRole = dto.Role.Trim();

            if (!IsValidEmail(normalizedEmail))
            {
                return ServiceResult.BadRequest("user.invalidEmail", "Please enter a valid email address for this user.");
            }

            if (normalizedRole != UserRoles.Admin && normalizedRole != UserRoles.User)
            {
                return ServiceResult.BadRequest("user.invalidRole", "The selected role is invalid.");
            }

            var user = await _context.Users.FirstOrDefaultAsync(candidate => candidate.Id == id);

            if (user == null)
            {
                return ServiceResult.NotFound("user.notFound", "User not found.");
            }

            if (hasCurrentAdminId && currentAdminId == id && user.Role == UserRoles.Admin && normalizedRole != UserRoles.Admin)
            {
                return ServiceResult.BadRequest("user.selfRoleChangeBlocked", "You cannot remove your own admin role here.");
            }

            var emailExists = await _context.Users
                .AnyAsync(candidate => candidate.Email == normalizedEmail && candidate.Id != id);

            if (emailExists)
            {
                return ServiceResult.BadRequest("user.emailAlreadyExists", "Another user already uses this email address.");
            }

            if (user.Role == UserRoles.Admin && normalizedRole != UserRoles.Admin)
            {
                var adminCount = await _context.Users.CountAsync(candidate => candidate.Role == UserRoles.Admin);

                if (adminCount <= 1)
                {
                    return ServiceResult.BadRequest("user.lastAdminRoleBlocked", "The last admin role cannot be removed.");
                }
            }

            user.Name = normalizedName;
            user.Email = normalizedEmail;
            user.Role = normalizedRole;

            await _context.SaveChangesAsync();

            return ServiceResult.Success(string.Empty, string.Empty, user.ToSummaryDto());
        }

        public async Task<ServiceResult> DeleteAsync(int id, ClaimsPrincipal userPrincipal)
        {
            var hasCurrentAdminId = int.TryParse(
                userPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                out var currentAdminId);

            if (hasCurrentAdminId && currentAdminId == id)
            {
                return ServiceResult.BadRequest("user.selfDeleteBlocked", "You cannot delete your own account here.");
            }

            var user = await _context.Users.FirstOrDefaultAsync(candidate => candidate.Id == id);

            if (user == null)
            {
                return ServiceResult.NotFound("user.notFound", "User not found.");
            }

            if (user.Role == UserRoles.Admin)
            {
                var adminCount = await _context.Users.CountAsync(candidate => candidate.Role == UserRoles.Admin);

                if (adminCount <= 1)
                {
                    return ServiceResult.BadRequest("user.lastAdminDeleteBlocked", "The last admin cannot be deleted.");
                }
            }

            var allUserCheckouts = await _context.Checkouts
                .Where(checkout => checkout.UserId == id)
                .ToListAsync();

            var activeEquipmentIds = allUserCheckouts
                .Where(checkout => checkout.ReturnedAt == null)
                .Select(checkout => checkout.EquipmentId)
                .Distinct()
                .ToList();

            var equipmentsToReset = await _context.Equipments
                .Where(equipment =>
                    activeEquipmentIds.Contains(equipment.Id) || equipment.MaintenanceByUserId == id)
                .ToListAsync();

            await using var transaction = await _context.Database.BeginTransactionAsync();

            foreach (var equipment in equipmentsToReset)
            {
                if (activeEquipmentIds.Contains(equipment.Id))
                {
                    equipment.Status = EquipmentStatus.Available;
                }

                if (equipment.MaintenanceByUserId == id)
                {
                    equipment.MaintenanceByUserId = null;

                    if (equipment.Status == EquipmentStatus.Maintenance)
                    {
                        equipment.Status = EquipmentStatus.Available;
                    }
                }
            }

            if (allUserCheckouts.Count > 0)
            {
                _context.Checkouts.RemoveRange(allUserCheckouts);
            }

            _context.Users.Remove(user);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return ServiceResult.Success("user.deleted", "User and related records deleted.");
        }

        private static bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return false;
            }

            if (!MailAddress.TryCreate(email, out var parsedAddress))
            {
                return false;
            }

            return parsedAddress.Address == email && parsedAddress.Host.Contains('.');
        }
    }
}
