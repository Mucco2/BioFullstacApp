using BioApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

var cs = builder.Configuration.GetConnectionString("Default");
builder.Services.AddDbContext<BioAppDbContext>(opt => opt.UseSqlServer(cs));

var app = builder.Build();

app.MapControllers();
app.Run();