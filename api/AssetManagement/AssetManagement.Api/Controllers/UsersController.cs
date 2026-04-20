using System.Net.Mail;
using System.Security.Claims;
using AssetManagement.Api.Constants;
using AssetManagement.Api.Data;
using AssetManagement.Api.Dtos;
using AssetManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssetManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = UserRoles.Admin)]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
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

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserSummaryDto>>> GetAll()
        {
            var users = await _context.Users
                .OrderBy(u => u.Name)
                .Select(u => new UserSummaryDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Role = u.Role
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<UserSummaryDto>> GetById(int id)
        {
            var user = await _context.Users
                .Where(candidate => candidate.Id == id)
                .Select(candidate => new UserSummaryDto
                {
                    Id = candidate.Id,
                    Name = candidate.Name,
                    Email = candidate.Email,
                    Role = candidate.Role
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound(new { message = "A felhasználó nem található." });
            }

            return Ok(user);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<UserSummaryDto>> Update(int id, UpdateUserDto dto)
        {
            var currentAdminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var hasCurrentAdminId = int.TryParse(currentAdminIdClaim, out var currentAdminId);
            var normalizedName = dto.Name.Trim();
            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            var normalizedRole = dto.Role.Trim();

            if (!IsValidEmail(normalizedEmail))
            {
                return BadRequest(new { message = "Csak érvényes email címmel lehet menteni a felhasználót." });
            }

            if (normalizedRole != UserRoles.Admin && normalizedRole != UserRoles.User)
            {
                return BadRequest(new { message = "A megadott szerepkör érvénytelen." });
            }

            var user = await _context.Users.FirstOrDefaultAsync(candidate => candidate.Id == id);

            if (user == null)
            {
                return NotFound(new { message = "A felhasználó nem található." });
            }

            if (hasCurrentAdminId && currentAdminId == id && user.Role == UserRoles.Admin && normalizedRole != UserRoles.Admin)
            {
                return BadRequest(new { message = "A saját admin jogosultságodat itt nem veheted el." });
            }

            var emailExists = await _context.Users
                .AnyAsync(candidate => candidate.Email == normalizedEmail && candidate.Id != id);

            if (emailExists)
            {
                return BadRequest(new { message = "Már létezik másik felhasználó ezzel az email címmel." });
            }

            if (user.Role == UserRoles.Admin && normalizedRole != UserRoles.Admin)
            {
                var adminCount = await _context.Users.CountAsync(candidate => candidate.Role == UserRoles.Admin);

                if (adminCount <= 1)
                {
                    return BadRequest(new { message = "Az utolsó admin jogosultsága nem vehető el." });
                }
            }

            user.Name = normalizedName;
            user.Email = normalizedEmail;
            user.Role = normalizedRole;

            await _context.SaveChangesAsync();

            return Ok(new UserSummaryDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var currentAdminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var hasCurrentAdminId = int.TryParse(currentAdminIdClaim, out var currentAdminId);

            if (hasCurrentAdminId && currentAdminId == id)
            {
                return BadRequest(new { message = "A saját fiókodat itt nem törölheted." });
            }

            var user = await _context.Users.FirstOrDefaultAsync(candidate => candidate.Id == id);

            if (user == null)
            {
                return NotFound(new { message = "A felhasználó nem található." });
            }

            if (user.Role == UserRoles.Admin)
            {
                var adminCount = await _context.Users.CountAsync(candidate => candidate.Role == UserRoles.Admin);

                if (adminCount <= 1)
                {
                    return BadRequest(new { message = "Az utolsó admin nem törölhető." });
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

            return Ok(new { message = "A felhasználó és a hozzá tartozó rekordok törölve lettek." });
        }
    }
}
