using AssetManagement.Api.Constants;
using AssetManagement.Api.Dtos;
using AssetManagement.Api.Extensions;
using AssetManagement.Api.Responses;
using AssetManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssetManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EquipmentController : ControllerBase
    {
        private readonly IEquipmentService _equipmentService;
        private readonly IEquipmentImageService _imageService;

        public EquipmentController(
            IEquipmentService equipmentService,
            IEquipmentImageService imageService)
        {
            _equipmentService = equipmentService;
            _imageService = imageService;
        }

        [HttpGet("/uploads/equipment/{fileName}")]
        [Authorize]
        public IActionResult GetEquipmentImage(string fileName)
        {
            var validationResult = _imageService.ValidateFileName(fileName);

            if (validationResult != null)
            {
                return BadRequest(ApiResponse.Create(validationResult.Code, validationResult.Message));
            }

            var filePath = _imageService.GetImageFilePath(fileName);

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound();
            }

            return PhysicalFile(filePath, _imageService.GetContentType(fileName));
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<EquipmentListItemDto>>> GetAll()
        {
            return Ok(await _equipmentService.GetAllAsync(User));
        }

        [HttpGet("{id:int}")]
        [Authorize]
        public async Task<ActionResult<EquipmentDetailsDto>> GetById(int id)
        {
            var equipment = await _equipmentService.GetByIdAsync(id, User);

            if (equipment == null)
            {
                return NotFound(ApiResponse.Create("equipment.notFound", "Asset not found."));
            }

            return Ok(equipment);
        }

        [HttpPost]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> Create([FromForm] CreateEquipmentDto dto)
        {
            return this.ToActionResult(await _equipmentService.CreateAsync(dto));
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> Update(int id, [FromForm] UpdateEquipmentDto dto)
        {
            return this.ToActionResult(await _equipmentService.UpdateAsync(id, dto));
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> Delete(int id)
        {
            return this.ToActionResult(await _equipmentService.DeleteAsync(id));
        }

        [HttpPost("{id:int}/checkout")]
        [Authorize]
        public async Task<IActionResult> CheckoutEquipment(int id, CreateCheckoutDto dto)
        {
            return this.ToActionResult(await _equipmentService.CheckoutAsync(id, dto, User));
        }

        [HttpPost("{id:int}/return")]
        [Authorize]
        public async Task<IActionResult> ReturnEquipment(int id, ReturnCheckoutDto dto)
        {
            return this.ToActionResult(await _equipmentService.ReturnAsync(id, dto, User));
        }

        [HttpPost("{id:int}/mark-maintenance")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> MarkMaintenance(int id)
        {
            return this.ToActionResult(await _equipmentService.MarkMaintenanceAsync(id, User));
        }

        [HttpPost("{id:int}/mark-available")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> MarkAvailable(int id)
        {
            return this.ToActionResult(await _equipmentService.MarkAvailableAsync(id));
        }
    }
}
