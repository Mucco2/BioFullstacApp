namespace BioApp.Api.Auth;

public record RegisterRequest(string Email, string Username, string Password);

public record LoginRequest(string EmailOrUsername, string Password);

public record AuthUser(int Id, string Email, string Username, bool IsActive);

public record AuthResponse(string Token, AuthUser User);
