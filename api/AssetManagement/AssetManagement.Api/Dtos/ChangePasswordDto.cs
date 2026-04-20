using System.ComponentModel.DataAnnotations;

namespace AssetManagement.Api.Dtos
{
    public class ChangePasswordDto
    {
        [Required]
        [StringLength(100)]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string NewPassword { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string ConfirmNewPassword { get; set; } = string.Empty;
    }
}
