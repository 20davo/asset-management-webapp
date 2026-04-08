using System.ComponentModel.DataAnnotations;

namespace AssetManagement.Api.Dtos
{
    public class UpdateEquipmentDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Category { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        public Microsoft.AspNetCore.Http.IFormFile? Image { get; set; }
        public bool RemoveImage { get; set; }

        [Required]
        [StringLength(100)]
        public string SerialNumber { get; set; } = string.Empty;
    }
}
