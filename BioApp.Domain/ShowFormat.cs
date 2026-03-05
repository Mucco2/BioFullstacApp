namespace BioApp.Domain.Entities;

public class ShowFormat
{
    public int Id { get; set; }
    public string Name { get; set; } = "";     // "2D" / "3D"
    public decimal PriceAdd { get; set; }      // ekstra pris for 3D fx

    public List<Screening> Screenings { get; set; } = new();
}