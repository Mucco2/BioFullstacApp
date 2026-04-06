using BioApp.Api.Auth;
using BioApp.Domain.Entities;
using BioApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BioApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly BioAppDbContext _db;
    private readonly JwtTokenService _tokenService;

    public AuthController(BioAppDbContext db, JwtTokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var username = request.Username.Trim();

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Email, username og password er påkrævet.");
        }

        if (await _db.Users.AnyAsync(u => u.Email == email))
        {
            return BadRequest("Email er allerede i brug.");
        }

        if (await _db.Users.AnyAsync(u => u.Username == username))
        {
            return BadRequest("Brugernavn er allerede i brug.");
        }

        var (hash, salt) = PasswordHasher.HashPassword(request.Password);
        var user = new User
        {
            Email = email,
            Username = username,
            PasswordHash = hash,
            PasswordSalt = salt,
            IsActive = true
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = _tokenService.CreateToken(user);
        var response = new AuthResponse(token, new AuthUser(user.Id, user.Email, user.Username, user.IsActive));
        return Ok(response);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var input = request.EmailOrUsername.Trim();
        if (string.IsNullOrWhiteSpace(input) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Email/brugernavn og password er påkrævet.");
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == input || u.Username == input);
        if (user is null)
        {
            return Unauthorized("Forkert login.");
        }

        if (!PasswordHasher.Verify(request.Password, user.PasswordHash, user.PasswordSalt))
        {
            return Unauthorized("Forkert login.");
        }

        var token = _tokenService.CreateToken(user);
        var response = new AuthResponse(token, new AuthUser(user.Id, user.Email, user.Username, user.IsActive));
        return Ok(response);
    }
}
