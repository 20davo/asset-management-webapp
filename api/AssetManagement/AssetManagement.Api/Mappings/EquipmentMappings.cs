using AssetManagement.Api.Constants;
using AssetManagement.Api.Dtos;
using AssetManagement.Api.Models;

namespace AssetManagement.Api.Mappings
{
    public static class EquipmentMappings
    {
        public static EquipmentDetailsDto ToDetailsDto(
            this Equipment equipment,
            bool isAdmin,
            int? currentUserId)
        {
            var orderedCheckouts = equipment.Checkouts
                .OrderByDescending(checkout => checkout.CheckedOutAt)
                .ToList();
            var orderedCheckoutsByActivity = equipment.Checkouts
                .OrderByDescending(checkout => checkout.ReturnedAt ?? checkout.CheckedOutAt)
                .ToList();
            var activeCheckout = orderedCheckouts.FirstOrDefault(checkout => checkout.ReturnedAt == null);
            var latestCheckout = orderedCheckouts.FirstOrDefault();
            var latestActivity = orderedCheckoutsByActivity.FirstOrDefault();
            var isCheckedOutByCurrentUser = currentUserId.HasValue
                && activeCheckout?.UserId == currentUserId.Value;

            return new EquipmentDetailsDto
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
                LastActivityAt = latestActivity?.ReturnedAt ?? latestActivity?.CheckedOutAt,
                ActiveCheckoutDueAt = activeCheckout?.DueAt,
                ActiveCheckoutUserName = activeCheckout?.User?.Name,
                CanReturn = equipment.Status == EquipmentStatus.CheckedOut
                    && (isAdmin || isCheckedOutByCurrentUser),
                IsCheckedOutByCurrentUser = isCheckedOutByCurrentUser,
                Checkouts = isAdmin
                    ? orderedCheckoutsByActivity
                        .Select(checkout => new CheckoutHistoryItemDto
                        {
                            Id = checkout.Id,
                            CheckedOutAt = checkout.CheckedOutAt,
                            DueAt = checkout.DueAt,
                            ReturnedAt = checkout.ReturnedAt,
                            Note = checkout.Note,
                            UserId = checkout.UserId,
                            UserName = checkout.User?.Name ?? string.Empty,
                            UserEmail = checkout.User?.Email ?? string.Empty
                        })
                        .ToList()
                    : new List<CheckoutHistoryItemDto>()
            };
        }
    }
}
