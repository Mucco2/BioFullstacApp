using BioApp.Domain.Entities;
using BioApp.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BioApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly BioAppDbContext _db;
    public UsersController(BioAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<List<User>> GetAll() =>
        await _db.Users.AsNoTracking().ToListAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<User>> GetById(int id)
    {
        var item = await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<User>> Create(User user)
    {
        // NOTE: til demo. Senere laver vi rigtig password hashing + DTOs
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, User user)
    {
        if (id != user.Id) return BadRequest("Route id and body id must match.");

        var exists = await _db.Users.AnyAsync(x => x.Id == id);
        if (!exists) return NotFound();

        _db.Entry(user).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.Users.FindAsync(id);
        if (item is null) return NotFound();

        _db.Users.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}