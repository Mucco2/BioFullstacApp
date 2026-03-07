using BioApp.Domain.Entities;
using BioApp.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BioApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScreeningsController : ControllerBase
{
    private readonly BioAppDbContext _db;
    public ScreeningsController(BioAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<List<Screening>> GetAll() =>
        await _db.Screenings.AsNoTracking().ToListAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Screening>> GetById(int id)
    {
        var item = await _db.Screenings.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Screening>> Create(Screening screening)
    {
        // FK checks
        if (!await _db.Movies.AnyAsync(m => m.Id == screening.MovieId))
            return BadRequest($"MovieId {screening.MovieId} does not exist.");

        if (!await _db.Auditoriums.AnyAsync(a => a.Id == screening.AuditoriumId))
            return BadRequest($"AuditoriumId {screening.AuditoriumId} does not exist.");

        if (!await _db.ShowFormats.AnyAsync(f => f.Id == screening.ShowFormatId))
            return BadRequest($"ShowFormatId {screening.ShowFormatId} does not exist.");

        _db.Screenings.Add(screening);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = screening.Id }, screening);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Screening screening)
    {
        if (id != screening.Id) return BadRequest("Route id and body id must match.");

        var exists = await _db.Screenings.AnyAsync(x => x.Id == id);
        if (!exists) return NotFound();

        _db.Entry(screening).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.Screenings.FindAsync(id);
        if (item is null) return NotFound();

        _db.Screenings.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // -----------------------------
    // EXTRA GET #1: screenings by movie + date
    // GET /api/screenings/by-movie-date?movieId=1&date=2026-03-05
    // -----------------------------
    [HttpGet("by-movie-date")]
    public async Task<ActionResult<List<Screening>>> GetByMovieAndDate([FromQuery] int movieId, [FromQuery] DateOnly date)
    {
        var start = date.ToDateTime(TimeOnly.MinValue);
        var end = start.AddDays(1);

        var result = await _db.Screenings.AsNoTracking()
            .Where(s => s.MovieId == movieId && s.StartsAt >= start && s.StartsAt < end)
            .OrderBy(s => s.StartsAt)
            .ToListAsync();

        return Ok(result);
    }

    // -----------------------------
    // EXTRA GET #2: available seats for screening
    // GET /api/screenings/{id}/available-seats
    // -----------------------------
    [HttpGet("{id:int}/available-seats")]
    public async Task<ActionResult<List<Seat>>> GetAvailableSeats(int id)
    {
        var screening = await _db.Screenings.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
        if (screening is null) return NotFound($"Screening {id} not found.");

        // Alle seats i salen
        var allSeats = _db.Seats.AsNoTracking().Where(s => s.AuditoriumId == screening.AuditoriumId);

        // Seats der allerede er booket på den screening (ikke cancelled)
        var bookedSeatIds = _db.BookingSeats
            .Where(bs => bs.Booking!.ScreeningId == id && bs.Booking!.Status != "Cancelled")
            .Select(bs => bs.SeatId);

        var available = await allSeats
            .Where(s => !bookedSeatIds.Contains(s.Id))
            .OrderBy(s => s.SeatRow).ThenBy(s => s.SeatNumber)
            .ToListAsync();

        return Ok(available);
    }
}