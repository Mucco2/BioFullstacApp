namespace BioApp.Domain.Entities;

public class Movie
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public int DurationMinutes { get; set; }
    public int? AgeLimit { get; set; }
    public DateOnly? ReleaseDate { get; set; }

    public List<Screening> Screenings { get; set; } = new();
}