using BioApp.Domain.Entities;
using BioApp.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BioApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeatsController : ControllerBase
{
    private readonly BioAppDbContext _db;
    public SeatsController(BioAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<List<Seat>> GetAll() =>
        await _db.Seats.AsNoTracking().ToListAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Seat>> GetById(int id)
    {
        var item = await _db.Seats.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Seat>> Create(Seat seat)
    {
        // FK check (pænere fejl end SQL exception)
        var auditoriumExists = await _db.Auditoriums.AnyAsync(a => a.Id == seat.AuditoriumId);
        if (!auditoriumExists) return BadRequest($"AuditoriumId {seat.AuditoriumId} does not exist.");

        _db.Seats.Add(seat);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = seat.Id }, seat);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Seat seat)
    {
        if (id != seat.Id) return BadRequest("Route id and body id must match.");

        var exists = await _db.Seats.AnyAsync(x => x.Id == id);
        if (!exists) return NotFound();

        _db.Entry(seat).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.Seats.FindAsync(id);
        if (item is null) return NotFound();

        _db.Seats.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}