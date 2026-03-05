namespace BioApp.Domain.Entities;

public class Booking
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public int ScreeningId { get; set; }
    public Screening? Screening { get; set; }

    public DateTime CreatedAt { get; set; }

    // "Pending" / "Paid" / "Cancelled"
    public string Status { get; set; } = "Pending";

    public string? Notes { get; set; }

    public List<BookingSeat> BookingSeats { get; set; } = new();
    public List<BookingItem> BookingItems { get; set; } = new();
}