using AssetManagement.Api.Data;
using AssetManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssetManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CheckoutController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CheckoutController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Checkout>>> GetAll()
        {
            var checkouts = await _context.Checkouts
                .Include(c => c.Equipment)
                .ToListAsync();

            return Ok(checkouts);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Checkout>> GetById(int id)
        {
            var checkout = await _context.Checkouts
                .Include(c => c.Equipment)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (checkout == null)
            {
                return NotFound();
            }

            return Ok(checkout);
        }

        [HttpPost]
        public async Task<ActionResult<Checkout>> Create(Checkout checkout)
        {
            var equipmentExists = await _context.Equipments.AnyAsync(e => e.Id == checkout.EquipmentId);

            if (!equipmentExists)
            {
                return BadRequest("A megadott EquipmentId nem létezik.");
            }

            _context.Checkouts.Add(checkout);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = checkout.Id }, checkout);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Checkout checkout)
        {
            if (id != checkout.Id)
            {
                return BadRequest("Az URL-ben lévő id és a bodyban lévő id nem egyezik.");
            }

            var existingCheckout = await _context.Checkouts.FindAsync(id);

            if (existingCheckout == null)
            {
                return NotFound();
            }

            var equipmentExists = await _context.Equipments.AnyAsync(e => e.Id == checkout.EquipmentId);

            if (!equipmentExists)
            {
                return BadRequest("A megadott EquipmentId nem létezik.");
            }

            existingCheckout.EquipmentId = checkout.EquipmentId;
            existingCheckout.UserName = checkout.UserName;
            existingCheckout.CheckedOutAt = checkout.CheckedOutAt;
            existingCheckout.DueAt = checkout.DueAt;
            existingCheckout.ReturnedAt = checkout.ReturnedAt;
            existingCheckout.Note = checkout.Note;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var checkout = await _context.Checkouts.FindAsync(id);

            if (checkout == null)
            {
                return NotFound();
            }

            _context.Checkouts.Remove(checkout);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}