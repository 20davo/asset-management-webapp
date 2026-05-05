using System.IdentityModel.Tokens.Jwt;
using System.Net.Mail;
using System.Security.Claims;
using System.Text;
using AssetManagement.Api.Constants;
using AssetManagement.Api.Data;
using AssetManagement.Api.Dtos;
using AssetManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace AssetManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
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

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            if (!_configuration.GetValue<bool>("Registration:Enabled"))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    code = "auth.registrationDisabled",
                    message = "New user registration is disabled in this environment."
                });
            }

            var normalizedName = dto.Name.Trim();
            var normalizedEmail = dto.Email.Trim().ToLower();

            if (!IsValidEmail(normalizedEmail))
            {
                return BadRequest(new { code = "auth.invalidEmail", message = "Please enter a valid email address." });
            }

            var emailExists = await _context.Users
                .AnyAsync(u => u.Email == normalizedEmail);

            if (emailExists)
            {
                return BadRequest(new { code = "auth.emailAlreadyExists", message = "A user with this email address already exists." });
            }

            var user = new User
            {
                Name = normalizedName,
                Email = normalizedEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = UserRoles.User
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                code = "auth.registered",
                message = "Registration completed successfully."
            });
        }

        [HttpPost("login")]
        [EnableRateLimiting("AuthPolicy")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var normalizedEmail = dto.Email.Trim().ToLower();

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

            if (user == null)
            {
                return Unauthorized(new { code = "auth.invalidCredentials", message = "The email address or password is incorrect." });
            }

            var isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);

            if (!isPasswordValid)
            {
                return Unauthorized(new { code = "auth.invalidCredentials", message = "The email address or password is incorrect." });
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: creds
            );

            var jwt = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new
            {
                code = "auth.loginSuccess",
                message = "Signed in successfully.",
                token = jwt,
                user = new
                {
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Role
                }
            });
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { code = "auth.invalidTokenUser", message = "The signed-in user could not be identified." });
            }

            var user = await _context.Users.FirstOrDefaultAsync(candidate => candidate.Id == userId);

            if (user == null)
            {
                return Unauthorized(new { code = "auth.userNotFound", message = "User not found." });
            }

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            {
                return BadRequest(new { code = "auth.currentPasswordInvalid", message = "The current password is incorrect." });
            }

            if (dto.NewPassword != dto.ConfirmNewPassword)
            {
                return BadRequest(new { code = "auth.passwordsDoNotMatch", message = "The new passwords do not match." });
            }

            if (dto.CurrentPassword == dto.NewPassword)
            {
                return BadRequest(new { code = "auth.passwordUnchanged", message = "The new password cannot be the same as the current password." });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

            await _context.SaveChangesAsync();

            return Ok(new { code = "auth.passwordUpdated", message = "Password updated successfully." });
        }
    }
}
