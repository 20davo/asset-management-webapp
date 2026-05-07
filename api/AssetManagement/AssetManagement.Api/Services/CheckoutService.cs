using System.Security.Claims;
using AssetManagement.Api.Data;
using AssetManagement.Api.Dtos;
using AssetManagement.Api.Mappings;
using Microsoft.EntityFrameworkCore;

namespace AssetManagement.Api.Services
{
    public interface ICheckoutService
    {
        Task<List<CheckoutResponseDto>> GetAllAsync();
        Task<CheckoutResponseDto?> GetByIdAsync(int id);
        Task<ServiceResult> GetByUserAsync(int userId);
        Task<ServiceResult> GetMyCheckoutsAsync(ClaimsPrincipal user);
    }

    public class CheckoutService : ICheckoutService
    {
        private readonly AppDbContext _context;

        public CheckoutService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<CheckoutResponseDto>> GetAllAsync()
        {
            return await BaseCheckoutQuery()
                .OrderByDescending(checkout => checkout.CheckedOutAt)
                .Select(checkout => checkout.ToResponseDto())
                .ToListAsync();
        }

        public async Task<CheckoutResponseDto?> GetByIdAsync(int id)
        {
            var checkout = await BaseCheckoutQuery()
                .FirstOrDefaultAsync(checkout => checkout.Id == id);

            return checkout?.ToResponseDto();
        }

        public async Task<ServiceResult> GetByUserAsync(int userId)
        {
            var userExists = await _context.Users.AnyAsync(user => user.Id == userId);

            if (!userExists)
            {
                return ServiceResult.NotFound("user.notFound", "User not found.");
            }

            var checkouts = await BaseCheckoutQuery()
                .Where(checkout => checkout.UserId == userId)
                .OrderByDescending(checkout => checkout.CheckedOutAt)
                .Select(checkout => checkout.ToResponseDto())
                .ToListAsync();

            return ServiceResult.Success(string.Empty, string.Empty, checkouts);
        }

        public async Task<ServiceResult> GetMyCheckoutsAsync(ClaimsPrincipal user)
        {
            if (!int.TryParse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
            {
                return ServiceResult.Unauthorized("auth.invalidTokenUser", "The signed-in user could not be identified.");
            }

            var checkouts = await BaseCheckoutQuery()
                .Where(checkout => checkout.UserId == userId)
                .OrderByDescending(checkout => checkout.CheckedOutAt)
                .Select(checkout => checkout.ToResponseDto())
                .ToListAsync();

            return ServiceResult.Success(string.Empty, string.Empty, checkouts);
        }

        private IQueryable<Models.Checkout> BaseCheckoutQuery()
        {
            return _context.Checkouts
                .Include(checkout => checkout.Equipment)
                .Include(checkout => checkout.User);
        }
    }
}
