using AssetManagement.Api.Dtos;
using AssetManagement.Api.Models;

namespace AssetManagement.Api.Mappings
{
    public static class CheckoutMappings
    {
        public static CheckoutResponseDto ToResponseDto(this Checkout checkout)
        {
            return new CheckoutResponseDto
            {
                Id = checkout.Id,
                CheckedOutAt = checkout.CheckedOutAt,
                DueAt = checkout.DueAt,
                ReturnedAt = checkout.ReturnedAt,
                Note = checkout.Note,
                Equipment = new CheckoutEquipmentDto
                {
                    Id = checkout.Equipment!.Id,
                    Name = checkout.Equipment.Name,
                    Category = checkout.Equipment.Category,
                    ImageUrl = checkout.Equipment.ImageUrl,
                    SerialNumber = checkout.Equipment.SerialNumber,
                    Status = checkout.Equipment.Status
                },
                User = new CheckoutUserDto
                {
                    Id = checkout.User!.Id,
                    Name = checkout.User.Name,
                    Email = checkout.User.Email
                }
            };
        }
    }
}
