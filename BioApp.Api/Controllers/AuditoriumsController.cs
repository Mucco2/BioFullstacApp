using BioApp.Domain.Entities;
using BioApp.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BioApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuditoriumsController : ControllerBase
{
    private readonly BioAppDbContext _db;
    public AuditoriumsController(BioAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<List<Auditorium>> GetAll() =>
        await _db.Auditoriums.AsNoTracking().ToListAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Auditorium>> GetById(int id)
    {
        var item = await _db.Auditoriums.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Auditorium>> Create(Auditorium auditorium)
    {
        _db.Auditoriums.Add(auditorium);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = auditorium.Id }, auditorium);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Auditorium auditorium)
    {
        if (id != auditorium.Id) return BadRequest("Route id and body id must match.");

        var exists = await _db.Auditoriums.AnyAsync(x => x.Id == id);
        if (!exists) return NotFound();

        _db.Entry(auditorium).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.Auditoriums.FindAsync(id);
        if (item is null) return NotFound();

        _db.Auditoriums.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}