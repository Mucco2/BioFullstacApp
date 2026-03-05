namespace BioApp.Domain.Entities;

public class Auditorium
{
    public int Id { get; set; }
    public string Name { get; set; } = "";

    // Vi brugte [Rows] i SQL, så i C# kalder vi den Rows.
    public int Rows { get; set; }
    public int SeatPerRow { get; set; }

    public List<Seat> Seats { get; set; } = new();
    public List<Screening> Screenings { get; set; } = new();
}

