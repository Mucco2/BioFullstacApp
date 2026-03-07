using BioApp.Domain.Entities;
using BioApp.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BioApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShowFormatsController : ControllerBase
{
    private readonly BioAppDbContext _db;
    public ShowFormatsController(BioAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<List<ShowFormat>> GetAll() =>
        await _db.ShowFormats.AsNoTracking().ToListAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ShowFormat>> GetById(int id)
    {
        var item = await _db.ShowFormats.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<ShowFormat>> Create(ShowFormat showFormat)
    {
        _db.ShowFormats.Add(showFormat);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = showFormat.Id }, showFormat);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, ShowFormat showFormat)
    {
        if (id != showFormat.Id) return BadRequest("Route id and body id must match.");

        var exists = await _db.ShowFormats.AnyAsync(x => x.Id == id);
        if (!exists) return NotFound();

        _db.Entry(showFormat).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.ShowFormats.FindAsync(id);
        if (item is null) return NotFound();

        _db.ShowFormats.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}