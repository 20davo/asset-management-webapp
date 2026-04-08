namespace AssetManagement.Api.Dtos
{
    public class EquipmentListItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string SerialNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string? ActiveCheckoutUserName { get; set; }
        public string? MaintenanceByUserName { get; set; }
    }
}
