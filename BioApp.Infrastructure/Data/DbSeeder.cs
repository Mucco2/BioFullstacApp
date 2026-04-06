using BioApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BioApp.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(BioAppDbContext db)
    {
        await db.Database.MigrateAsync();

        var format2D = await db.ShowFormats.FirstOrDefaultAsync(f => f.Name == "2D");
        if (format2D is null)
        {
            format2D = new ShowFormat { Name = "2D", PriceAdd = 0m };
            db.ShowFormats.Add(format2D);
        }

        var format3D = await db.ShowFormats.FirstOrDefaultAsync(f => f.Name == "3D");
        if (format3D is null)
        {
            format3D = new ShowFormat { Name = "3D", PriceAdd = 30m };
            db.ShowFormats.Add(format3D);
        }

        if (db.ChangeTracker.HasChanges())
        {
            await db.SaveChangesAsync();
        }

        if (!await db.Movies.AnyAsync())
        {
            var movies = new List<Movie>
            {
                new()
                {
                    Title = "Shelter: Part One",
                    Description = "Action adventure with a fast pace.",
                    DurationMinutes = 128,
                    AgeLimit = 15,
                    ReleaseDate = DateOnly.FromDateTime(DateTime.Today.AddDays(-10)),
                    ImageUrl = "https://picsum.photos/seed/shelter/600/900"
                },
                new()
                {
                    Title = "Nordic Nights",
                    Description = "Drama under northern lights.",
                    DurationMinutes = 112,
                    AgeLimit = 11,
                    ReleaseDate = DateOnly.FromDateTime(DateTime.Today.AddDays(-35)),
                    ImageUrl = "https://picsum.photos/seed/nordic/600/900"
                },
                new()
                {
                    Title = "Tiny Explorers",
                    Description = "Family animation with big dreams.",
                    DurationMinutes = 95,
                    AgeLimit = 0,
                    ReleaseDate = DateOnly.FromDateTime(DateTime.Today.AddDays(-60)),
                    ImageUrl = "https://picsum.photos/seed/explorers/600/900"
                }
            };

            db.Movies.AddRange(movies);
            await db.SaveChangesAsync();
        }

        if (!await db.Auditoriums.AnyAsync())
        {
            db.Auditoriums.AddRange(
                new Auditorium { Name = "Sal 1", Rows = 8, SeatPerRow = 10 },
                new Auditorium { Name = "Sal 2", Rows = 6, SeatPerRow = 12 }
            );
            await db.SaveChangesAsync();
        }

        if (!await db.Seats.AnyAsync())
        {
            var auditoriums = await db.Auditoriums.AsNoTracking().ToListAsync();
            var seats = new List<Seat>();
            foreach (var auditorium in auditoriums)
            {
                for (var row = 1; row <= auditorium.Rows; row += 1)
                {
                    for (var seat = 1; seat <= auditorium.SeatPerRow; seat += 1)
                    {
                        seats.Add(new Seat
                        {
                            AuditoriumId = auditorium.Id,
                            SeatRow = row,
                            SeatNumber = seat,
                            SeatType = row == 1 ? "VIP" : "Standard"
                        });
                    }
                }
            }

            if (seats.Count > 0)
            {
                db.Seats.AddRange(seats);
                await db.SaveChangesAsync();
            }
        }

        if (!await db.Products.AnyAsync())
        {
            db.Products.AddRange(
                new Product { Name = "Cola", Category = "Drink", Price = 35m, IsActive = true },
                new Product { Name = "Vand", Category = "Drink", Price = 25m, IsActive = true },
                new Product { Name = "Popcorn", Category = "Snack", Price = 45m, IsActive = true },
                new Product { Name = "Nachos", Category = "Snack", Price = 55m, IsActive = true }
            );
            await db.SaveChangesAsync();
        }

        if (!await db.Users.AnyAsync())
        {
            db.Users.Add(new User
            {
                Email = "demo@bioapp.dk",
                Username = "DemoUser",
                PasswordHash = Convert.FromBase64String("AQIDBAUGBwgJCgsMDQ4PEA=="),
                PasswordSalt = Convert.FromBase64String("AAECAwQFBgcICQoLDA0ODw=="),
                IsActive = true
            });
            await db.SaveChangesAsync();
        }

        var has2D = await db.Screenings.AnyAsync(s => s.ShowFormatId == format2D.Id);
        var has3D = await db.Screenings.AnyAsync(s => s.ShowFormatId == format3D.Id);

        if (!has2D || !has3D)
        {
            var movies = await db.Movies.AsNoTracking().ToListAsync();
            var auditoriums = await db.Auditoriums.AsNoTracking().ToListAsync();

            if (movies.Count > 0 && auditoriums.Count > 0)
            {
                var screenings = new List<Screening>();
                var startBase = DateTime.Today.AddDays(1).AddHours(16);
                var offset = 0;

                for (var i = 0; i < movies.Count; i += 1)
                {
                    var movie = movies[i];
                    var auditorium = auditoriums[i % auditoriums.Count];

                    if (!has2D)
                    {
                        screenings.Add(new Screening
                        {
                            MovieId = movie.Id,
                            AuditoriumId = auditorium.Id,
                            ShowFormatId = format2D.Id,
                            StartsAt = startBase.AddHours(offset),
                            BaseTicketPrice = 110m
                        });
                        offset += 2;
                    }

                    if (!has3D)
                    {
                        screenings.Add(new Screening
                        {
                            MovieId = movie.Id,
                            AuditoriumId = auditoriums[(i + 1) % auditoriums.Count].Id,
                            ShowFormatId = format3D.Id,
                            StartsAt = startBase.AddHours(offset),
                            BaseTicketPrice = 120m
                        });
                        offset += 2;
                    }
                }

                if (screenings.Count > 0)
                {
                    db.Screenings.AddRange(screenings);
                    await db.SaveChangesAsync();
                }
            }
        }
    }
}
