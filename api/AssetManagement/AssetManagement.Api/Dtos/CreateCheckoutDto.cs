using System.ComponentModel.DataAnnotations;

namespace AssetManagement.Api.Dtos
{
    public class CreateCheckoutDto
    {
        [Required]
        [StringLength(100)]
        public string UserName { get; set; } = string.Empty;

        [Required]
        public DateTime DueAt { get; set; }

        [StringLength(500)]
        public string? Note { get; set; }
    }
}