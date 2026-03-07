using BioApp.Domain.Entities;
using BioApp.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BioApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingItemsController : ControllerBase
{
    private readonly BioAppDbContext _db;
    public BookingItemsController(BioAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<List<BookingItem>> GetAll() =>
        await _db.BookingItems.AsNoTracking().ToListAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<BookingItem>> GetById(int id)
    {
        var item = await _db.BookingItems.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<BookingItem>> Create(BookingItem bookingItem)
    {
        if (!await _db.Bookings.AnyAsync(b => b.Id == bookingItem.BookingId))
            return BadRequest($"BookingId {bookingItem.BookingId} does not exist.");

        if (!await _db.Products.AnyAsync(p => p.Id == bookingItem.ProductId))
            return BadRequest($"ProductId {bookingItem.ProductId} does not exist.");

        _db.BookingItems.Add(bookingItem);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = bookingItem.Id }, bookingItem);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, BookingItem bookingItem)
    {
        if (id != bookingItem.Id) return BadRequest("Route id and body id must match.");

        var exists = await _db.BookingItems.AnyAsync(x => x.Id == id);
        if (!exists) return NotFound();

        _db.Entry(bookingItem).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.BookingItems.FindAsync(id);
        if (item is null) return NotFound();

        _db.BookingItems.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}