namespace AssetManagement.Api.Dtos
{
    public class CheckoutResponseDto
    {
        public int Id { get; set; }
        public DateTime CheckedOutAt { get; set; }
        public DateTime DueAt { get; set; }
        public DateTime? ReturnedAt { get; set; }
        public string? Note { get; set; }

        public CheckoutEquipmentDto Equipment { get; set; } = new();
        public CheckoutUserDto User { get; set; } = new();
    }

    public class CheckoutEquipmentDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string SerialNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class CheckoutUserDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }
}