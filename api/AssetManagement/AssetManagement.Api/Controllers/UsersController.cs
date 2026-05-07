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
    [Authorize(Roles = UserRoles.Admin)]
    public class UsersController : ControllerBase
    {
        private readonly IUserManagementService _userManagementService;

        public UsersController(IUserManagementService userManagementService)
        {
            _userManagementService = userManagementService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserSummaryDto>>> GetAll()
        {
            return Ok(await _userManagementService.GetAllAsync());
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<UserSummaryDto>> GetById(int id)
        {
            var user = await _userManagementService.GetByIdAsync(id);

            if (user == null)
            {
                return NotFound(ApiResponse.Create("user.notFound", "User not found."));
            }

            return Ok(user);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, UpdateUserDto dto)
        {
            var result = await _userManagementService.UpdateAsync(id, dto, User);

            if (string.IsNullOrWhiteSpace(result.Code) && result.Data is UserSummaryDto user)
            {
                return Ok(user);
            }

            return this.ToActionResult(result);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            return this.ToActionResult(await _userManagementService.DeleteAsync(id, User));
        }
    }
}
