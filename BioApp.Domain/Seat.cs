namespace BioApp.Domain.Entities;

public class Seat
{
    public int Id { get; set; }

    public int AuditoriumId { get; set; }
    public Auditorium? Auditorium { get; set; }

    public int SeatRow { get; set; }
    public int SeatNumber { get; set; }

    // "Standard" / "VIP" etc.
    public string SeatType { get; set; } = "Standard";

    public List<BookingSeat> BookingSeats { get; set; } = new();
}