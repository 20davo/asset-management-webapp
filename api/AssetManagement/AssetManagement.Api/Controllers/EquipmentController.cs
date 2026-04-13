using AssetManagement.Api.Data;
using AssetManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AssetManagement.Api.Dtos;
using AssetManagement.Api.Constants;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.StaticFiles;

namespace AssetManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EquipmentController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private const long MaxImageBytes = 2 * 1024 * 1024;
        private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        };
        private static readonly HashSet<string> AllowedImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png",
            "image/webp"
        };

        public EquipmentController(AppDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        private string GetEquipmentUploadDirectory()
        {
            var webRootPath = _environment.WebRootPath;

            if (string.IsNullOrWhiteSpace(webRootPath))
            {
                webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
            }

            return Path.Combine(webRootPath, "uploads", "equipment");
        }

        private static async Task<bool> HasAllowedImageSignatureAsync(IFormFile image, string extension)
        {
            var header = new byte[12];

            await using var stream = image.OpenReadStream();
            var bytesRead = await stream.ReadAsync(header);

            return extension switch
            {
                ".jpg" or ".jpeg" => bytesRead >= 3
                    && header[0] == 0xFF
                    && header[1] == 0xD8
                    && header[2] == 0xFF,
                ".png" => bytesRead >= 8
                    && header[0] == 0x89
                    && header[1] == 0x50
                    && header[2] == 0x4E
                    && header[3] == 0x47
                    && header[4] == 0x0D
                    && header[5] == 0x0A
                    && header[6] == 0x1A
                    && header[7] == 0x0A,
                ".webp" => bytesRead >= 12
                    && header[0] == 0x52
                    && header[1] == 0x49
                    && header[2] == 0x46
                    && header[3] == 0x46
                    && header[8] == 0x57
                    && header[9] == 0x45
                    && header[10] == 0x42
                    && header[11] == 0x50,
                _ => false
            };
        }

        private async Task<IActionResult?> ValidateImageAsync(IFormFile? image)
        {
            if (image == null || image.Length == 0)
            {
                return null;
            }

            if (image.Length > MaxImageBytes)
            {
                return BadRequest(new { message = "A kép mérete legfeljebb 2 MB lehet." });
            }

            var extension = Path.GetExtension(image.FileName);

            if (string.IsNullOrWhiteSpace(extension) || !AllowedImageExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Csak JPG, PNG vagy WEBP kép tölthető fel." });
            }

            if (!string.IsNullOrWhiteSpace(image.ContentType)
                && !AllowedImageContentTypes.Contains(image.ContentType))
            {
                return BadRequest(new { message = "A feltöltött fájl nem érvényes képfájl." });
            }

            if (!await HasAllowedImageSignatureAsync(image, extension))
            {
                return BadRequest(new { message = "A feltöltött fájl tartalma nem egyezik egy támogatott képformátummal." });
            }

            return null;
        }

        private async Task<string?> SaveImageAsync(IFormFile? image)
        {
            if (image == null || image.Length == 0)
            {
                return null;
            }

            var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
            var fileName = $"{Guid.NewGuid():N}{extension}";
            var uploadDirectory = GetEquipmentUploadDirectory();

            Directory.CreateDirectory(uploadDirectory);

            var filePath = Path.Combine(uploadDirectory, fileName);

            await using var stream = System.IO.File.Create(filePath);
            await image.CopyToAsync(stream);

            return $"/uploads/equipment/{fileName}";
        }

        private void DeleteImageFile(string? imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
            {
                return;
            }

            var normalizedPath = imageUrl.Replace('\\', '/');

            if (!normalizedPath.StartsWith("/uploads/equipment/", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var fileName = Path.GetFileName(normalizedPath);

            if (string.IsNullOrWhiteSpace(fileName))
            {
                return;
            }

            var filePath = Path.Combine(GetEquipmentUploadDirectory(), fileName);

            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
        }

        [HttpGet("/uploads/equipment/{fileName}")]
        [Authorize]
        public IActionResult GetEquipmentImage(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName) || Path.GetFileName(fileName) != fileName)
            {
                return BadRequest(new { message = "Érvénytelen képfájlnév." });
            }

            var filePath = Path.Combine(GetEquipmentUploadDirectory(), fileName);

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound();
            }

            var contentTypeProvider = new FileExtensionContentTypeProvider();

            if (!contentTypeProvider.TryGetContentType(fileName, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            return PhysicalFile(filePath, contentType);
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<EquipmentListItemDto>>> GetAll()
        {
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            var isAdmin = roleClaim == UserRoles.Admin;

            var equipments = await _context.Equipments
                .OrderBy(e => e.Name)
                .Select(e => new EquipmentListItemDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    Category = e.Category,
                    Description = e.Description,
                    ImageUrl = e.ImageUrl,
                    SerialNumber = e.SerialNumber,
                    Status = e.Status,
                    CreatedAt = e.CreatedAt,
                    ActiveCheckoutUserName = e.Checkouts
                        .Where(c => c.ReturnedAt == null)
                        .OrderByDescending(c => c.CheckedOutAt)
                        .Select(c => c.User != null ? c.User.Name : null)
                        .FirstOrDefault(),
                    ActiveCheckoutDueAt = e.Checkouts
                        .Where(c => c.ReturnedAt == null)
                        .OrderByDescending(c => c.CheckedOutAt)
                        .Select(c => (DateTime?)c.DueAt)
                        .FirstOrDefault(),
                    MaintenanceByUserName = isAdmin && e.MaintenanceByUser != null
                        ? e.MaintenanceByUser.Name
                        : null
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
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isAdmin = roleClaim == UserRoles.Admin;
            var hasCurrentUserId = int.TryParse(userIdClaim, out var currentUserId);
            var orderedCheckouts = equipment.Checkouts
                .OrderByDescending(c => c.CheckedOutAt)
                .ToList();
            var activeCheckout = orderedCheckouts.FirstOrDefault(c => c.ReturnedAt == null);
            var latestCheckout = orderedCheckouts.FirstOrDefault();
            var isCheckedOutByCurrentUser = hasCurrentUserId
                && activeCheckout?.UserId == currentUserId;

            var result = new EquipmentDetailsDto
            {
                Id = equipment.Id,
                Name = equipment.Name,
                Category = equipment.Category,
                Description = equipment.Description,
                ImageUrl = equipment.ImageUrl,
                SerialNumber = equipment.SerialNumber,
                Status = equipment.Status,
                CreatedAt = equipment.CreatedAt,
                TotalCheckoutCount = orderedCheckouts.Count,
                LastCheckedOutAt = latestCheckout?.CheckedOutAt,
                ActiveCheckoutDueAt = activeCheckout?.DueAt,
                ActiveCheckoutUserName = activeCheckout?.User?.Name,
                CanReturn = equipment.Status == EquipmentStatus.CheckedOut
                    && (isAdmin || isCheckedOutByCurrentUser),
                IsCheckedOutByCurrentUser = isCheckedOutByCurrentUser,
                Checkouts = isAdmin
                    ? orderedCheckouts
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
        public async Task<IActionResult> Create([FromForm] CreateEquipmentDto dto)
        {
            var normalizedName = dto.Name.Trim();
            var normalizedCategory = dto.Category.Trim();
            var normalizedSerialNumber = dto.SerialNumber.Trim();
            var normalizedDescription = string.IsNullOrWhiteSpace(dto.Description)
                ? null
                : dto.Description.Trim();

            var imageValidationResult = await ValidateImageAsync(dto.Image);

            if (imageValidationResult != null)
            {
                return imageValidationResult;
            }

            var serialExists = await _context.Equipments
                .AnyAsync(e => e.SerialNumber == normalizedSerialNumber);

            if (serialExists)
            {
                return BadRequest(new { message = "Már létezik eszköz ezzel a gyári számmal." });
            }

            var savedImageUrl = await SaveImageAsync(dto.Image);

            var equipment = new Equipment
            {
                Name = normalizedName,
                Category = normalizedCategory,
                Description = normalizedDescription,
                ImageUrl = savedImageUrl,
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
        public async Task<IActionResult> Update(int id, [FromForm] UpdateEquipmentDto dto)
        {
            var normalizedName = dto.Name.Trim();
            var normalizedCategory = dto.Category.Trim();
            var normalizedSerialNumber = dto.SerialNumber.Trim();
            var normalizedDescription = string.IsNullOrWhiteSpace(dto.Description)
                ? null
                : dto.Description.Trim();

            var imageValidationResult = await ValidateImageAsync(dto.Image);

            if (imageValidationResult != null)
            {
                return imageValidationResult;
            }

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

            var previousImageUrl = existingEquipment.ImageUrl;
            string? nextImageUrl = previousImageUrl;

            if (dto.Image != null)
            {
                nextImageUrl = await SaveImageAsync(dto.Image);
            }
            else if (dto.RemoveImage)
            {
                nextImageUrl = null;
            }

            existingEquipment.Name = normalizedName;
            existingEquipment.Category = normalizedCategory;
            existingEquipment.Description = normalizedDescription;
            existingEquipment.ImageUrl = nextImageUrl;
            existingEquipment.SerialNumber = normalizedSerialNumber;

            await _context.SaveChangesAsync();

            if (dto.Image != null || (dto.RemoveImage && dto.Image == null))
            {
                DeleteImageFile(previousImageUrl);
            }

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

            DeleteImageFile(equipment.ImageUrl);
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

            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            var isAdmin = roleClaim == UserRoles.Admin;

            if (dto.DueAt <= DateTime.UtcNow)
            {
                return BadRequest(new { message = "A határidőnek jövőbeli dátumnak kell lennie." });
            }

            if (equipment.Status != EquipmentStatus.Available)
            {
                return BadRequest(new { message = "Az eszköz jelenleg nem elérhető kikérésre." });
            }

            var targetUserId = userId;

            if (isAdmin)
            {
                if (!dto.AssignedUserId.HasValue)
                {
                    return BadRequest(new { message = "Adminként ki kell választanod, melyik felhasználóhoz rendeled az eszközt." });
                }

                if (dto.AssignedUserId.Value == userId)
                {
                    return BadRequest(new { message = "Az admin nem kérheti ki saját magának az eszközt." });
                }

                var assignedUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == dto.AssignedUserId.Value);

                if (assignedUser == null)
                {
                    return BadRequest(new { message = "A kiválasztott felhasználó nem található." });
                }

                if (assignedUser.Role != UserRoles.User)
                {
                    return BadRequest(new { message = "Az eszköz csak normál felhasználóhoz rendelhető." });
                }

                targetUserId = assignedUser.Id;
            }

            var checkout = new Checkout
            {
                EquipmentId = equipment.Id,
                UserId = targetUserId,
                DueAt = dto.DueAt,
                Note = normalizedNote,
                CheckedOutAt = DateTime.UtcNow
            };

            _context.Checkouts.Add(checkout);

            equipment.Status = EquipmentStatus.CheckedOut;
            equipment.MaintenanceByUserId = null;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = isAdmin
                    ? "Az eszköz sikeresen felhasználóhoz rendelve."
                    : "Az eszköz sikeresen kikérve.",
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
            equipment.MaintenanceByUserId = null;

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

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Érvénytelen felhasználói azonosító a tokenben." });
            }

            equipment.Status = EquipmentStatus.Maintenance;
            equipment.MaintenanceByUserId = userId;
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
            equipment.MaintenanceByUserId = null;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Az eszköz ismét elérhető.",
                equipmentId = equipment.Id
            });
        }
    }
}
