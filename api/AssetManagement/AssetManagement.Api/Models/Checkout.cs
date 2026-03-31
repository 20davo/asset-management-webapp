using System.Text.Json.Serialization;

namespace AssetManagement.Api.Models
{
    public class Checkout
    {
        public int Id { get; set; }

        public int EquipmentId { get; set; }

        [JsonIgnore]
        public Equipment? Equipment { get; set; }

        public string UserName { get; set; } = string.Empty;

        public DateTime CheckedOutAt { get; set; } = DateTime.UtcNow;
        public DateTime DueAt { get; set; }
        public DateTime? ReturnedAt { get; set; }

        public string? Note { get; set; }
    }
}