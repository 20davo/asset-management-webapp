using AssetManagement.Api.Constants;
using AssetManagement.Api.Data;
using AssetManagement.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AssetManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CheckoutController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CheckoutController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<IEnumerable<CheckoutResponseDto>>> GetAll()
        {
            var checkouts = await _context.Checkouts
                .Include(c => c.Equipment)
                .Include(c => c.User)
                .OrderByDescending(c => c.CheckedOutAt)
                .Select(c => new CheckoutResponseDto
                {
                    Id = c.Id,
                    CheckedOutAt = c.CheckedOutAt,
                    DueAt = c.DueAt,
                    ReturnedAt = c.ReturnedAt,
                    Note = c.Note,
                    Equipment = new CheckoutEquipmentDto
                    {
                        Id = c.Equipment!.Id,
                        Name = c.Equipment.Name,
                        Category = c.Equipment.Category,
                        ImageUrl = c.Equipment.ImageUrl,
                        SerialNumber = c.Equipment.SerialNumber,
                        Status = c.Equipment.Status
                    },
                    User = new CheckoutUserDto
                    {
                        Id = c.User!.Id,
                        Name = c.User.Name,
                        Email = c.User.Email
                    }
                })
                .ToListAsync();

            return Ok(checkouts);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<CheckoutResponseDto>> GetById(int id)
        {
            var checkout = await _context.Checkouts
                .Include(c => c.Equipment)
                .Include(c => c.User)
                .Where(c => c.Id == id)
                .Select(c => new CheckoutResponseDto
                {
                    Id = c.Id,
                    CheckedOutAt = c.CheckedOutAt,
                    DueAt = c.DueAt,
                    ReturnedAt = c.ReturnedAt,
                    Note = c.Note,
                    Equipment = new CheckoutEquipmentDto
                    {
                        Id = c.Equipment!.Id,
                        Name = c.Equipment.Name,
                        Category = c.Equipment.Category,
                        ImageUrl = c.Equipment.ImageUrl,
                        SerialNumber = c.Equipment.SerialNumber,
                        Status = c.Equipment.Status
                    },
                    User = new CheckoutUserDto
                    {
                        Id = c.User!.Id,
                        Name = c.User.Name,
                        Email = c.User.Email
                    }
                })
                .FirstOrDefaultAsync();

            if (checkout == null)
            {
                return NotFound(new { message = "A kikérés nem található." });
            }

            return Ok(checkout);
        }

        [HttpGet("user/{userId:int}")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<IEnumerable<CheckoutResponseDto>>> GetByUser(int userId)
        {
            var userExists = await _context.Users.AnyAsync(u => u.Id == userId);

            if (!userExists)
            {
                return NotFound(new { message = "A felhasználó nem található." });
            }

            var checkouts = await _context.Checkouts
                .Include(c => c.Equipment)
                .Include(c => c.User)
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.CheckedOutAt)
                .Select(c => new CheckoutResponseDto
                {
                    Id = c.Id,
                    CheckedOutAt = c.CheckedOutAt,
                    DueAt = c.DueAt,
                    ReturnedAt = c.ReturnedAt,
                    Note = c.Note,
                    Equipment = new CheckoutEquipmentDto
                    {
                        Id = c.Equipment!.Id,
                        Name = c.Equipment.Name,
                        Category = c.Equipment.Category,
                        ImageUrl = c.Equipment.ImageUrl,
                        SerialNumber = c.Equipment.SerialNumber,
                        Status = c.Equipment.Status
                    },
                    User = new CheckoutUserDto
                    {
                        Id = c.User!.Id,
                        Name = c.User.Name,
                        Email = c.User.Email
                    }
                })
                .ToListAsync();

            return Ok(checkouts);
        }

        [HttpGet("my")]
        public async Task<ActionResult<IEnumerable<CheckoutResponseDto>>> GetMyCheckouts()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Érvénytelen felhasználói azonosító a tokenben." });
            }

            var checkouts = await _context.Checkouts
                .Include(c => c.Equipment)
                .Include(c => c.User)
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.CheckedOutAt)
                .Select(c => new CheckoutResponseDto
                {
                    Id = c.Id,
                    CheckedOutAt = c.CheckedOutAt,
                    DueAt = c.DueAt,
                    ReturnedAt = c.ReturnedAt,
                    Note = c.Note,
                    Equipment = new CheckoutEquipmentDto
                    {
                        Id = c.Equipment!.Id,
                        Name = c.Equipment.Name,
                        Category = c.Equipment.Category,
                        ImageUrl = c.Equipment.ImageUrl,
                        SerialNumber = c.Equipment.SerialNumber,
                        Status = c.Equipment.Status
                    },
                    User = new CheckoutUserDto
                    {
                        Id = c.User!.Id,
                        Name = c.User.Name,
                        Email = c.User.Email
                    }
                })
                .ToListAsync();

            return Ok(checkouts);
        }
    }
}
