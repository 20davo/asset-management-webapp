using System.ComponentModel.DataAnnotations;

namespace AssetManagement.Api.Dtos
{
    public class CreateEquipmentDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Category { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        [StringLength(100)]
        public string SerialNumber { get; set; } = string.Empty;
    }
}