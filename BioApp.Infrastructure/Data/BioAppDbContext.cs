using BioApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BioApp.Infrastructure.Data;

public class BioAppDbContext : DbContext
{
    public BioAppDbContext(DbContextOptions<BioAppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Movie> Movies => Set<Movie>();
    public DbSet<Auditorium> Auditoriums => Set<Auditorium>();
    public DbSet<Seat> Seats => Set<Seat>();
    public DbSet<ShowFormat> ShowFormats => Set<ShowFormat>();
    public DbSet<Screening> Screenings => Set<Screening>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<BookingSeat> BookingSeats => Set<BookingSeat>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<BookingItem> BookingItems => Set<BookingItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // -------------------------
        // Users
        // -------------------------
        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("Users");
            e.HasKey(x => x.Id);

            e.HasIndex(x => x.Email).IsUnique();
            e.HasIndex(x => x.Username).IsUnique();

            e.Property(x => x.Email).HasMaxLength(256).IsRequired();
            e.Property(x => x.Username).HasMaxLength(50).IsRequired();

            e.Property(x => x.PasswordHash).IsRequired();
            e.Property(x => x.PasswordSalt).IsRequired();

            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.Property(x => x.IsActive).HasDefaultValue(true);
        });

        // -------------------------
        // Movies
        // -------------------------
        modelBuilder.Entity<Movie>(e =>
        {
            e.ToTable("Movies");
            e.HasKey(x => x.Id);

            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.Description).HasMaxLength(1000);

            e.Property(x => x.DurationMinutes).IsRequired();
            // AgeLimit + ReleaseDate kan være NULL
        });

        // -------------------------
        // Auditoriums
        // -------------------------
        modelBuilder.Entity<Auditorium>(e =>
        {
            e.ToTable("Auditoriums");
            e.HasKey(x => x.Id);

            e.Property(x => x.Name).HasMaxLength(50).IsRequired();
            e.HasIndex(x => x.Name).IsUnique();

            // SQL kolonnen hedder [Rows]
            e.Property(x => x.Rows)
             .HasColumnName("Rows")
             .IsRequired();

            e.Property(x => x.SeatPerRow).IsRequired();

            // Checks (valgfrit i EF - DB har dem i SQL script)
            // e.ToTable(t => t.HasCheckConstraint("CK_Auditoriums_Rows", "[Rows] BETWEEN 1 AND 50"));
            // e.ToTable(t => t.HasCheckConstraint("CK_Auditoriums_SeatPerRow", "SeatPerRow BETWEEN 1 AND 50"));
        });

        // -------------------------
        // Seats
        // -------------------------
        modelBuilder.Entity<Seat>(e =>
        {
            e.ToTable("Seats");
            e.HasKey(x => x.Id);

            e.Property(x => x.SeatType).HasMaxLength(20).HasDefaultValue("Standard");

            e.HasOne(x => x.Auditorium)
             .WithMany(a => a.Seats)
             .HasForeignKey(x => x.AuditoriumId);

            // UNIQUE (AuditoriumId, SeatRow, SeatNumber)
            e.HasIndex(x => new { x.AuditoriumId, x.SeatRow, x.SeatNumber })
             .IsUnique();
        });

        // -------------------------
        // ShowFormats
        // -------------------------
        modelBuilder.Entity<ShowFormat>(e =>
        {
            e.ToTable("ShowFormats");
            e.HasKey(x => x.Id);

            e.Property(x => x.Name).HasMaxLength(20).IsRequired();
            e.HasIndex(x => x.Name).IsUnique();

            e.Property(x => x.PriceAdd).HasColumnType("decimal(10,2)").HasDefaultValue(0m);

            // Seed (2D/3D) - kan også gøres via SQL. Her gør vi det i EF.
            e.HasData(
                new ShowFormat { Id = 1, Name = "2D", PriceAdd = 0m },
                new ShowFormat { Id = 2, Name = "3D", PriceAdd = 30m }
            );
        });

        // -------------------------
        // Screenings
        // -------------------------
        modelBuilder.Entity<Screening>(e =>
        {
            e.ToTable("Screenings");
            e.HasKey(x => x.Id);

            e.Property(x => x.StartsAt).IsRequired();
            e.Property(x => x.BaseTicketPrice).HasColumnType("decimal(10,2)").IsRequired();

            e.HasOne(x => x.Movie)
             .WithMany(m => m.Screenings)
             .HasForeignKey(x => x.MovieId);

            e.HasOne(x => x.Auditorium)
             .WithMany(a => a.Screenings)
             .HasForeignKey(x => x.AuditoriumId);

            e.HasOne(x => x.ShowFormat)
             .WithMany(sf => sf.Screenings)
             .HasForeignKey(x => x.ShowFormatId);

            e.HasIndex(x => x.StartsAt);
            e.HasIndex(x => x.MovieId);
        });

        // -------------------------
        // Bookings
        // -------------------------
        modelBuilder.Entity<Booking>(e =>
        {
            e.ToTable("Bookings");
            e.HasKey(x => x.Id);

            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.Property(x => x.Status).HasMaxLength(20).HasDefaultValue("Pending");
            e.Property(x => x.Notes).HasMaxLength(400);

            e.HasOne(x => x.User)
             .WithMany(u => u.Bookings)
             .HasForeignKey(x => x.UserId);

            e.HasOne(x => x.Screening)
             .WithMany(s => s.Bookings)
             .HasForeignKey(x => x.ScreeningId);

            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.ScreeningId);
        });

        // -------------------------
        // BookingSeats (join table med composite key)
        // -------------------------
       modelBuilder.Entity<BookingSeat>(e =>
{
    e.ToTable("BookingSeats");
    e.HasKey(x => new { x.BookingId, x.SeatId });

    e.Property(x => x.Price).HasColumnType("decimal(10,2)").IsRequired();

    e.HasOne(x => x.Booking)
     .WithMany(b => b.BookingSeats)
     .HasForeignKey(x => x.BookingId)
     .OnDelete(DeleteBehavior.Cascade);

    e.HasOne(x => x.Seat)
     .WithMany(s => s.BookingSeats)
     .HasForeignKey(x => x.SeatId)
     .OnDelete(DeleteBehavior.NoAction); // <-- Fixer "multiple cascade paths"
});

        // -------------------------
        // Products
        // -------------------------
        modelBuilder.Entity<Product>(e =>
        {
            e.ToTable("Products");
            e.HasKey(x => x.Id);

            e.Property(x => x.Name).HasMaxLength(80).IsRequired();
            e.Property(x => x.Category).HasMaxLength(30).IsRequired();
            e.Property(x => x.Price).HasColumnType("decimal(10,2)").IsRequired();
            e.Property(x => x.IsActive).HasDefaultValue(true);
        });

        // -------------------------
        // BookingItems
        // -------------------------
        modelBuilder.Entity<BookingItem>(e =>
        {
            e.ToTable("BookingItems");
            e.HasKey(x => x.Id);

            e.Property(x => x.UnitPrice).HasColumnType("decimal(10,2)").IsRequired();

            e.HasOne(x => x.Booking)
             .WithMany(b => b.BookingItems)
             .HasForeignKey(x => x.BookingId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.Product)
             .WithMany(p => p.BookingItems)
             .HasForeignKey(x => x.ProductId);

            // UNIQUE (BookingId, ProductId)
            e.HasIndex(x => new { x.BookingId, x.ProductId })
             .IsUnique();
        });
    }
}