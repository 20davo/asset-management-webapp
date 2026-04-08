namespace AssetManagement.Api.Dtos
{
    public class EquipmentDetailsDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string SerialNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int TotalCheckoutCount { get; set; }
        public DateTime? LastCheckedOutAt { get; set; }
        public DateTime? ActiveCheckoutDueAt { get; set; }
        public string? ActiveCheckoutUserName { get; set; }
        public bool CanReturn { get; set; }
        public bool IsCheckedOutByCurrentUser { get; set; }

        public List<CheckoutHistoryItemDto> Checkouts { get; set; } = new();
    }

    public class CheckoutHistoryItemDto
    {
        public int Id { get; set; }
        public DateTime CheckedOutAt { get; set; }
        public DateTime DueAt { get; set; }
        public DateTime? ReturnedAt { get; set; }
        public string? Note { get; set; }

        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
    }
}
