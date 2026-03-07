using BioApp.Domain.Entities;
using BioApp.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BioApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly BioAppDbContext _db;
    public BookingsController(BioAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<List<Booking>> GetAll() =>
        await _db.Bookings.AsNoTracking().ToListAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Booking>> GetById(int id)
    {
        var item = await _db.Bookings.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Booking>> Create(Booking booking)
    {
        if (!await _db.Users.AnyAsync(u => u.Id == booking.UserId))
            return BadRequest($"UserId {booking.UserId} does not exist.");

        if (!await _db.Screenings.AnyAsync(s => s.Id == booking.ScreeningId))
            return BadRequest($"ScreeningId {booking.ScreeningId} does not exist.");

        _db.Bookings.Add(booking);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = booking.Id }, booking);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Booking booking)
    {
        if (id != booking.Id) return BadRequest("Route id and body id must match.");

        var exists = await _db.Bookings.AnyAsync(x => x.Id == id);
        if (!exists) return NotFound();

        _db.Entry(booking).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.Bookings.FindAsync(id);
        if (item is null) return NotFound();

        _db.Bookings.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}