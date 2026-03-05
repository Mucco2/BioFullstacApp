namespace BioApp.Domain.Entities;

public class Screening
{
    public int Id { get; set; }

    public int MovieId { get; set; }
    public Movie? Movie { get; set; }

    public int AuditoriumId { get; set; }
    public Auditorium? Auditorium { get; set; }

    public int ShowFormatId { get; set; }
    public ShowFormat? ShowFormat { get; set; }

    public DateTime StartsAt { get; set; }
    public decimal BaseTicketPrice { get; set; }

    public List<Booking> Bookings { get; set; } = new();
}