using AssetManagement.Api.Data;
using AssetManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AssetManagement.Api.Dtos;
using AssetManagement.Api.Constants;

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
        public async Task<ActionResult<IEnumerable<Equipment>>> GetAll()
        {
            var equipments = await _context.Equipments.ToListAsync();
            return Ok(equipments);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Equipment>> GetById(int id)
        {
            var equipment = await _context.Equipments
                .Include(e => e.Checkouts)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (equipment == null)
            {
                return NotFound();
            }

            return Ok(equipment);
        }

        [HttpPost]
        public async Task<ActionResult<Equipment>> Create(CreateEquipmentDto dto)
        {
            var equipment = new Equipment
            {
                Name = dto.Name,
                Category = dto.Category,
                Description = dto.Description,
                SerialNumber = dto.SerialNumber,
                Status = EquipmentStatus.Available,
                CreatedAt = DateTime.UtcNow
            };

            _context.Equipments.Add(equipment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = equipment.Id }, equipment);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateEquipmentDto dto)
        {
            var existingEquipment = await _context.Equipments.FindAsync(id);

            if (existingEquipment == null)
            {
                return NotFound();
            }

            existingEquipment.Name = dto.Name;
            existingEquipment.Category = dto.Category;
            existingEquipment.Description = dto.Description;
            existingEquipment.SerialNumber = dto.SerialNumber;
            existingEquipment.Status = dto.Status;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var equipment = await _context.Equipments.FindAsync(id);

            if (equipment == null)
            {
                return NotFound();
            }

            _context.Equipments.Remove(equipment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/checkout")]
        public async Task<IActionResult> CheckoutEquipment(int id, CreateCheckoutDto dto)
        {
            var equipment = await _context.Equipments.FindAsync(id);

            if (equipment == null)
            {
                return NotFound("Az eszköz nem található.");
            }

            if (dto.DueAt <= DateTime.UtcNow)
            {
                return BadRequest("A határidőnek jövőbeli dátumnak kell lennie.");
            }

            if (equipment.Status != EquipmentStatus.Available)
            {
                return BadRequest("Az eszköz jelenleg nem elérhető kikérésre.");
            }

            var checkout = new Checkout
            {
                EquipmentId = equipment.Id,
                UserName = dto.UserName,
                DueAt = dto.DueAt,
                Note = dto.Note,
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
        public async Task<IActionResult> ReturnEquipment(int id, ReturnCheckoutDto dto)
        {
            var equipment = await _context.Equipments.FindAsync(id);

            if (equipment == null)
            {
                return NotFound("Az eszköz nem található.");
            }

            var activeCheckout = await _context.Checkouts
                .Where(c => c.EquipmentId == id && c.ReturnedAt == null)
                .OrderByDescending(c => c.CheckedOutAt)
                .FirstOrDefaultAsync();

            if (activeCheckout == null)
            {
                return BadRequest("Ehhez az eszközhöz nincs aktív kikérés.");
            }

            activeCheckout.ReturnedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(dto.Note))
            {
                activeCheckout.Note = dto.Note;
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
    }
}