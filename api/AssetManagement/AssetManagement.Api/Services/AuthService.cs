using System.IdentityModel.Tokens.Jwt;
using System.Net.Mail;
using System.Security.Claims;
using System.Text;
using AssetManagement.Api.Constants;
using AssetManagement.Api.Data;
using AssetManagement.Api.Dtos;
using AssetManagement.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace AssetManagement.Api.Services
{
    public interface IAuthService
    {
        Task<ServiceResult> RegisterAsync(RegisterDto dto);
        Task<ServiceResult> LoginAsync(LoginDto dto);
        Task<ServiceResult> ChangePasswordAsync(ChangePasswordDto dto, ClaimsPrincipal userPrincipal);
    }

    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<ServiceResult> RegisterAsync(RegisterDto dto)
        {
            if (!_configuration.GetValue<bool>("Registration:Enabled"))
            {
                return new ServiceResult
                {
                    Status = ServiceResultStatus.Forbidden,
                    Code = "auth.registrationDisabled",
                    Message = "New user registration is disabled in this environment."
                };
            }

            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

            if (!IsValidEmail(normalizedEmail))
            {
                return ServiceResult.BadRequest("auth.invalidEmail", "Please enter a valid email address.");
            }

            var emailExists = await _context.Users
                .AnyAsync(user => user.Email == normalizedEmail);

            if (emailExists)
            {
                return ServiceResult.BadRequest("auth.emailAlreadyExists", "A user with this email address already exists.");
            }

            var user = new User
            {
                Name = dto.Name.Trim(),
                Email = normalizedEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = UserRoles.User
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return ServiceResult.Success("auth.registered", "Registration completed successfully.");
        }

        public async Task<ServiceResult> LoginAsync(LoginDto dto)
        {
            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

            var user = await _context.Users
                .FirstOrDefaultAsync(candidate => candidate.Email == normalizedEmail);

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                return new ServiceResult
                {
                    Status = ServiceResultStatus.Unauthorized,
                    Code = "auth.invalidCredentials",
                    Message = "The email address or password is incorrect."
                };
            }

            return ServiceResult.Success(
                "auth.loginSuccess",
                "Signed in successfully.",
                new
                {
                    token = CreateJwt(user),
                    user = new
                    {
                        user.Id,
                        user.Name,
                        user.Email,
                        user.Role
                    }
                });
        }

        public async Task<ServiceResult> ChangePasswordAsync(ChangePasswordDto dto, ClaimsPrincipal userPrincipal)
        {
            if (!int.TryParse(userPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
            {
                return ServiceResult.Unauthorized("auth.invalidTokenUser", "The signed-in user could not be identified.");
            }

            var user = await _context.Users.FirstOrDefaultAsync(candidate => candidate.Id == userId);

            if (user == null)
            {
                return ServiceResult.Unauthorized("auth.userNotFound", "User not found.");
            }

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            {
                return ServiceResult.BadRequest("auth.currentPasswordInvalid", "The current password is incorrect.");
            }

            if (dto.NewPassword != dto.ConfirmNewPassword)
            {
                return ServiceResult.BadRequest("auth.passwordsDoNotMatch", "The new passwords do not match.");
            }

            if (dto.CurrentPassword == dto.NewPassword)
            {
                return ServiceResult.BadRequest("auth.passwordUnchanged", "The new password cannot be the same as the current password.");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

            await _context.SaveChangesAsync();

            return ServiceResult.Success("auth.passwordUpdated", "Password updated successfully.");
        }

        private string CreateJwt(User user)
        {
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

            return new JwtSecurityTokenHandler().WriteToken(token);
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
    }
}
