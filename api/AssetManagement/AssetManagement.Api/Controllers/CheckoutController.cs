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
    [Authorize]
    public class CheckoutController : ControllerBase
    {
        private readonly ICheckoutService _checkoutService;

        public CheckoutController(ICheckoutService checkoutService)
        {
            _checkoutService = checkoutService;
        }

        [HttpGet]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<IEnumerable<CheckoutResponseDto>>> GetAll()
        {
            return Ok(await _checkoutService.GetAllAsync());
        }

        [HttpGet("{id:int}")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<CheckoutResponseDto>> GetById(int id)
        {
            var checkout = await _checkoutService.GetByIdAsync(id);

            if (checkout == null)
            {
                return NotFound(ApiResponse.Create("checkout.notFound", "Assignment not found."));
            }

            return Ok(checkout);
        }

        [HttpGet("user/{userId:int}")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> GetByUser(int userId)
        {
            return this.ToActionResult(await _checkoutService.GetByUserAsync(userId));
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMyCheckouts()
        {
            return this.ToActionResult(await _checkoutService.GetMyCheckoutsAsync(User));
        }
    }
}
