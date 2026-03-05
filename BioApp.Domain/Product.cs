namespace BioApp.Domain.Entities;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";

    // "Drink" / "Food" / "Snack"
    public string Category { get; set; } = "";

    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;

    public List<BookingItem> BookingItems { get; set; } = new();
}