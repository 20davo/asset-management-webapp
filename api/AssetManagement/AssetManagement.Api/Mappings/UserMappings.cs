using AssetManagement.Api.Dtos;
using AssetManagement.Api.Models;

namespace AssetManagement.Api.Mappings
{
    public static class UserMappings
    {
        public static UserSummaryDto ToSummaryDto(this User user)
        {
            return new UserSummaryDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role
            };
        }
    }
}
