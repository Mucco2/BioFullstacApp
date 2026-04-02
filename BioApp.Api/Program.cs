using BioApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var cs = builder.Configuration.GetConnectionString("Default");
builder.Services.AddDbContext<BioAppDbContext>(opt => opt.UseSqlServer(cs));

var app = builder.Build();

app.UseCors("Frontend");
app.MapControllers();
app.Run();
