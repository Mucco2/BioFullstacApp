using BioApp.Domain.Entities;
using BioApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BioApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingSeatsController : ControllerBase
{
    private readonly BioAppDbContext _db;
    public BookingSeatsController(BioAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<List<BookingSeat>> GetAll() =>
        await _db.BookingSeats.AsNoTracking().ToListAsync();

    // GET api/bookingseats?bookingId=1&seatId=2
    [HttpGet("by-key")]
    public async Task<ActionResult<BookingSeat>> GetByKey([FromQuery] int bookingId, [FromQuery] int seatId)
    {
        var item = await _db.BookingSeats.AsNoTracking()
            .FirstOrDefaultAsync(x => x.BookingId == bookingId && x.SeatId == seatId);

        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<BookingSeat>> Create(BookingSeat bookingSeat)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdValue) || !int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized("Invalid user token.");
        }

        var booking = await _db.Bookings.AsNoTracking().FirstOrDefaultAsync(b => b.Id == bookingSeat.BookingId);
        if (booking is null)
        {
            return BadRequest($"BookingId {bookingSeat.BookingId} does not exist.");
        }

        if (booking.UserId != userId)
        {
            return Forbid();
        }

        if (!await _db.Seats.AnyAsync(s => s.Id == bookingSeat.SeatId))
            return BadRequest($"SeatId {bookingSeat.SeatId} does not exist.");

        _db.BookingSeats.Add(bookingSeat);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetByKey), new { bookingId = bookingSeat.BookingId, seatId = bookingSeat.SeatId }, bookingSeat);
    }

    // DELETE api/bookingseats?bookingId=1&seatId=2
    [HttpDelete]
    public async Task<IActionResult> Delete([FromQuery] int bookingId, [FromQuery] int seatId)
    {
        var item = await _db.BookingSeats.FindAsync(bookingId, seatId);
        if (item is null) return NotFound();

        _db.BookingSeats.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
