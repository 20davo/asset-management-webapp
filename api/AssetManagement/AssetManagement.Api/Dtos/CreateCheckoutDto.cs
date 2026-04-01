using System.ComponentModel.DataAnnotations;

namespace AssetManagement.Api.Dtos
{
    public class CreateCheckoutDto
    {
        [Required]
        public DateTime DueAt { get; set; }

        [StringLength(500)]
        public string? Note { get; set; }
    }
}