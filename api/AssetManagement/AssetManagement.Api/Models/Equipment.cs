using AssetManagement.Api.Constants;

namespace AssetManagement.Api.Models
{
    public class Equipment
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string SerialNumber { get; set; } = string.Empty;
        public string Status { get; set; } = EquipmentStatus.Available;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int? MaintenanceByUserId { get; set; }
        public User? MaintenanceByUser { get; set; }

        public List<Checkout> Checkouts { get; set; } = new();
    }
}
