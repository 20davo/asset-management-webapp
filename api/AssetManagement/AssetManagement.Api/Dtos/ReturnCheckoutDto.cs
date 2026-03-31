using System.ComponentModel.DataAnnotations;

namespace AssetManagement.Api.Dtos
{
    public class ReturnCheckoutDto
    {
        [StringLength(500)]
        public string? Note { get; set; }
    }
}