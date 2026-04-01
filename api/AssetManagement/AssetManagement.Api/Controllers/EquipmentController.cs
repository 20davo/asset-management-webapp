using AssetManagement.Api.Data;
using AssetManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AssetManagement.Api.Dtos;
using AssetManagement.Api.Constants;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace AssetManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EquipmentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EquipmentController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<EquipmentListItemDto>>> GetAll()
        {
            var equipments = await _context.Equipments
                .OrderBy(e => e.Name)
                .Select(e => new EquipmentListItemDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    Category = e.Category,
                    Description = e.Description,
                    SerialNumber = e.SerialNumber,
                    Status = e.Status,
                    CreatedAt = e.CreatedAt
                })
                .ToListAsync();

            return Ok(equipments);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<EquipmentDetailsDto>> GetById(int id)
        {
            var equipment = await _context.Equipments
                .Include(e => e.Checkouts)
                    .ThenInclude(c => c.User)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (equipment == null)
            {
                return NotFound(new { message = "Az eszköz nem található." });
            }

            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            var isAdmin = roleClaim == UserRoles.Admin;

            var result = new EquipmentDetailsDto
            {
                Id = equipment.Id,
                Name = equipment.Name,
                Category = equipment.Category,
                Description = equipment.Description,
                SerialNumber = equipment.SerialNumber,
                Status = equipment.Status,
                CreatedAt = equipment.CreatedAt,
                Checkouts = isAdmin
                    ? equipment.Checkouts
                        .OrderByDescending(c => c.CheckedOutAt)
                        .Select(c => new CheckoutHistoryItemDto
                        {
                            Id = c.Id,
                            CheckedOutAt = c.CheckedOutAt,
                            DueAt = c.DueAt,
                            ReturnedAt = c.ReturnedAt,
                            Note = c.Note,
                            UserId = c.UserId,
                            UserName = c.User?.Name ?? string.Empty,
                            UserEmail = c.User?.Email ?? string.Empty
                        })
                        .ToList()
                    : new List<CheckoutHistoryItemDto>()
            };

            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> Create(CreateEquipmentDto dto)
        {
            var normalizedName = dto.Name.Trim();
            var normalizedCategory = dto.Category.Trim();
            var normalizedSerialNumber = dto.SerialNumber.Trim();
            var normalizedDescription = string.IsNullOrWhiteSpace(dto.Description)
                ? null
                : dto.Description.Trim();

            var serialExists = await _context.Equipments
                .AnyAsync(e => e.SerialNumber == normalizedSerialNumber);

            if (serialExists)
            {
                return BadRequest(new { message = "Már létezik eszköz ezzel a gyári számmal." });
            }

            var equipment = new Equipment
            {
                Name = normalizedName,
                Category = normalizedCategory,
                Description = normalizedDescription,
                SerialNumber = normalizedSerialNumber,
                Status = EquipmentStatus.Available,
                CreatedAt = DateTime.UtcNow
            };

            _context.Equipments.Add(equipment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = equipment.Id }, new
            {
                message = "Az eszköz sikeresen létrehozva.",
                data = equipment
            });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> Update(int id, UpdateEquipmentDto dto)
        {
            var normalizedName = dto.Name.Trim();
            var normalizedCategory = dto.Category.Trim();
            var normalizedSerialNumber = dto.SerialNumber.Trim();
            var normalizedDescription = string.IsNullOrWhiteSpace(dto.Description)
                ? null
                : dto.Description.Trim();

            var existingEquipment = await _context.Equipments.FindAsync(id);

            if (existingEquipment == null)
            {
                return NotFound(new { message = "Az eszköz nem található." });
            }

            var serialExists = await _context.Equipments
                .AnyAsync(e => e.SerialNumber == normalizedSerialNumber && e.Id != id);

            if (serialExists)
            {
                return BadRequest(new { message = "Már létezik másik eszköz ezzel a gyári számmal." });
            }

            existingEquipment.Name = normalizedName;
            existingEquipment.Category = normalizedCategory;
            existingEquipment.Description = normalizedDescription;
            existingEquipment.SerialNumber = normalizedSerialNumber;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Az eszköz sikeresen frissítve.",
                equipmentId = existingEquipment.Id
            });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> Delete(int id)
        {
            var equipment = await _context.Equipments.FindAsync(id);

            if (equipment == null)
            {
                return NotFound(new { message = "Az eszköz nem található." });
            }

            var hasActiveCheckout = await _context.Checkouts
                .AnyAsync(c => c.EquipmentId == id && c.ReturnedAt == null);

            if (hasActiveCheckout)
            {
                return BadRequest(new { message = "Az eszköz nem törölhető, mert jelenleg ki van kérve." });
            }

            _context.Equipments.Remove(equipment);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Az eszköz sikeresen törölve.",
                equipmentId = id
            });
        }

        [HttpPost("{id}/checkout")]
        [Authorize]
        public async Task<IActionResult> CheckoutEquipment(int id, CreateCheckoutDto dto)
        {
            var normalizedNote = string.IsNullOrWhiteSpace(dto.Note)
                ? null
                : dto.Note.Trim();

            var equipment = await _context.Equipments.FindAsync(id);

            if (equipment == null)
            {
                return NotFound(new { message = "Az eszköz nem található." });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Érvénytelen felhasználói azonosító a tokenben." });
            }

            if (dto.DueAt <= DateTime.UtcNow)
            {
                return BadRequest(new { message = "A határidőnek jövőbeli dátumnak kell lennie." });
            }

            if (equipment.Status != EquipmentStatus.Available)
            {
                return BadRequest(new { message = "Az eszköz jelenleg nem elérhető kikérésre." });
            }

            var checkout = new Checkout
            {
                EquipmentId = equipment.Id,
                UserId = userId,
                DueAt = dto.DueAt,
                Note = normalizedNote,
                CheckedOutAt = DateTime.UtcNow
            };

            _context.Checkouts.Add(checkout);

            equipment.Status = EquipmentStatus.CheckedOut;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Az eszköz sikeresen kikérve.",
                equipmentId = equipment.Id,
                checkoutId = checkout.Id
            });
        }

        [HttpPost("{id}/return")]
        [Authorize]
        public async Task<IActionResult> ReturnEquipment(int id, ReturnCheckoutDto dto)
        {
            var equipment = await _context.Equipments.FindAsync(id);

            if (equipment == null)
            {
                return NotFound(new { message = "Az eszköz nem található." });
            }

            var activeCheckout = await _context.Checkouts
                .Where(c => c.EquipmentId == id && c.ReturnedAt == null)
                .OrderByDescending(c => c.CheckedOutAt)
                .FirstOrDefaultAsync();

            if (activeCheckout == null)
            {
                return BadRequest(new { message = "Ehhez az eszközhöz nincs aktív kikérés." });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Érvénytelen felhasználói azonosító a tokenben." });
            }

            var isAdmin = roleClaim == UserRoles.Admin;
            var isOwner = activeCheckout.UserId == userId;

            if (!isAdmin && !isOwner)
            {
                return Forbid();
            }

            activeCheckout.ReturnedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(dto.Note))
            {
                activeCheckout.Note = dto.Note.Trim();
            }

            equipment.Status = EquipmentStatus.Available;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Az eszköz sikeresen visszahozva.",
                equipmentId = equipment.Id,
                checkoutId = activeCheckout.Id
            });
        }

        [HttpPost("{id}/mark-maintenance")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> MarkMaintenance(int id)
        {
            var equipment = await _context.Equipments.FindAsync(id);

            if (equipment == null)
            {
                return NotFound(new { message = "Az eszköz nem található." });
            }

            if (equipment.Status == EquipmentStatus.CheckedOut)
            {
                return BadRequest(new { message = "A kikért eszköz nem állítható karbantartás alá." });
            }

            if (equipment.Status == EquipmentStatus.Maintenance)
            {
                return BadRequest(new { message = "Az eszköz már karbantartás alatt van." });
            }

            equipment.Status = EquipmentStatus.Maintenance;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Az eszköz karbantartás alá helyezve.",
                equipmentId = equipment.Id
            });
        }

        [HttpPost("{id}/mark-available")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> MarkAvailable(int id)
        {
            var equipment = await _context.Equipments.FindAsync(id);

            if (equipment == null)
            {
                return NotFound(new { message = "Az eszköz nem található." });
            }

            if (equipment.Status != EquipmentStatus.Maintenance)
            {
                return BadRequest(new { message = "Csak karbantartás alatt lévő eszköz állítható elérhetőre." });
            }

            equipment.Status = EquipmentStatus.Available;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Az eszköz ismét elérhető.",
                equipmentId = equipment.Id
            });
        }
    }
}