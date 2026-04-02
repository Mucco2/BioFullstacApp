import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { API_BASE_URL } from './app.constants';
import {
  Auditorium,
  Booking,
  Movie,
  Product,
  Screening,
  Seat,
  ShowFormat,
  User
} from './models';

type StatusType = 'info' | 'ok' | 'error';

type Step = {
  id: number;
  label: string;
};

type ViewMode = 'booking' | 'admin';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  apiBase = API_BASE_URL;

  statusMessage = 'Vælg format og start din booking.';
  statusType: StatusType = 'info';

  viewMode: ViewMode = 'booking';

  steps: Step[] = [
    { id: 1, label: 'Format' },
    { id: 2, label: 'Film' },
    { id: 3, label: 'Tid' },
    { id: 4, label: 'Plads' },
    { id: 5, label: 'Mad/Drikke' },
    { id: 6, label: 'Opsummering' }
  ];

  step = 1;

  showFormats: ShowFormat[] = [];
  movies: Movie[] = [];
  screenings: Screening[] = [];
  products: Product[] = [];
  users: User[] = [];
  auditoriums: Auditorium[] = [];
  seats: Seat[] = [];

  selectedFormatId: number | null = null;
  selectedMovieId: number | null = null;
  selectedScreeningId: number | null = null;
  selectedSeatIds = new Set<number>();

  availableSeats: Seat[] = [];
  seatRows: number[] = [];
  seatsByRow: Record<number, Seat[]> = {};

  productQuantities: Record<number, number> = {};

  selectedUserId: number | null = null;
  userForm = {
    email: '',
    username: '',
    passwordHash: 'AQIDBAUGBwgJCgsMDQ4PEA==',
    passwordSalt: 'AAECAwQFBgcICQoLDA0ODw==',
    isActive: true
  };

  bookingResult: Booking | null = null;

  showFormatForm = {
    name: '2D',
    priceAdd: 0
  };

  movieForm = {
    title: '',
    description: '',
    durationMinutes: 120,
    ageLimit: '' as number | '',
    releaseDate: ''
  };

  auditoriumForm = {
    name: 'Sal 1',
    rows: 8,
    seatPerRow: 10
  };

  seatForm = {
    auditoriumId: 0,
    seatRow: 1,
    seatNumber: 1,
    seatType: 'Standard'
  };

  screeningForm = {
    movieId: 0,
    auditoriumId: 0,
    showFormatId: 0,
    startsAt: '',
    baseTicketPrice: 120
  };

  productForm = {
    name: '',
    category: 'Drink',
    price: 0,
    isActive: true
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
    if (mode === 'admin') {
      this.loadAdminData();
    }
  }

  loadInitialData(): void {
    this.api.getShowFormats().subscribe({
      next: formats => (this.showFormats = formats),
      error: err => this.setStatus(`Kunne ikke hente formater. ${this.formatError(err)}`, 'error')
    });

    this.api.getMovies().subscribe({
      next: movies => (this.movies = movies),
      error: err => this.setStatus(`Kunne ikke hente film. ${this.formatError(err)}`, 'error')
    });

    this.api.getScreenings().subscribe({
      next: screenings => (this.screenings = screenings),
      error: err => this.setStatus(`Kunne ikke hente spilletider. ${this.formatError(err)}`, 'error')
    });

    this.api.getProducts().subscribe({
      next: products => {
        this.products = products;
        for (const product of products) {
          if (this.productQuantities[product.id] === undefined) {
            this.productQuantities[product.id] = 0;
          }
        }
      },
      error: err => this.setStatus(`Kunne ikke hente produkter. ${this.formatError(err)}`, 'error')
    });

    this.api.getUsers().subscribe({
      next: users => (this.users = users),
      error: err => this.setStatus(`Kunne ikke hente brugere. ${this.formatError(err)}`, 'error')
    });
  }

  loadAdminData(): void {
    this.loadInitialData();
    this.loadAuditoriums();
    this.loadSeats();
  }

  loadAuditoriums(): void {
    this.api.getAuditoriums().subscribe({
      next: auditoriums => (this.auditoriums = auditoriums),
      error: err => this.setStatus(`Kunne ikke hente sale. ${this.formatError(err)}`, 'error')
    });
  }

  loadSeats(): void {
    this.api.getSeats().subscribe({
      next: seats => (this.seats = seats),
      error: err => this.setStatus(`Kunne ikke hente sæder. ${this.formatError(err)}`, 'error')
    });
  }

  get selectedFormat(): ShowFormat | undefined {
    return this.showFormats.find(format => format.id === this.selectedFormatId!);
  }

  get selectedMovie(): Movie | undefined {
    return this.movies.find(movie => movie.id === this.selectedMovieId!);
  }

  get selectedScreening(): Screening | undefined {
    return this.screenings.find(screening => screening.id === this.selectedScreeningId!);
  }

  get filteredMovies(): Movie[] {
    if (!this.selectedFormatId) {
      return [];
    }
    const movieIds = new Set(
      this.screenings
        .filter(screening => screening.showFormatId === this.selectedFormatId)
        .map(screening => screening.movieId)
    );
    return this.movies.filter(movie => movieIds.has(movie.id));
  }

  get filteredScreenings(): Screening[] {
    if (!this.selectedFormatId || !this.selectedMovieId) {
      return [];
    }
    return this.screenings
      .filter(
        screening =>
          screening.showFormatId === this.selectedFormatId && screening.movieId === this.selectedMovieId
      )
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }

  get ticketPrice(): number {
    const screening = this.selectedScreening;
    const format = this.selectedFormat;
    if (!screening || !format) {
      return 0;
    }
    return Number(screening.baseTicketPrice) + Number(format.priceAdd);
  }

  get seatCount(): number {
    return this.selectedSeatIds.size;
  }

  get ticketTotal(): number {
    return this.ticketPrice * this.seatCount;
  }

  get itemsTotal(): number {
    return this.products.reduce((sum, product) => sum + this.getQuantity(product.id) * product.price, 0);
  }

  get grandTotal(): number {
    return this.ticketTotal + this.itemsTotal;
  }

  get selectedProducts(): Array<{ product: Product; quantity: number }> {
    return this.products
      .map(product => ({ product, quantity: this.getQuantity(product.id) }))
      .filter(item => item.quantity > 0);
  }

  selectFormat(formatId: number): void {
    if (this.selectedFormatId === formatId) {
      return;
    }
    this.selectedFormatId = formatId;
    this.selectedMovieId = null;
    this.selectedScreeningId = null;
    this.availableSeats = [];
    this.seatRows = [];
    this.seatsByRow = {};
    this.selectedSeatIds.clear();
    this.step = 2;
  }

  selectMovie(movieId: number): void {
    if (this.selectedMovieId === movieId) {
      return;
    }
    this.selectedMovieId = movieId;
    this.selectedScreeningId = null;
    this.availableSeats = [];
    this.seatRows = [];
    this.seatsByRow = {};
    this.selectedSeatIds.clear();
    this.step = 3;
  }

  selectScreening(screeningId: number): void {
    this.selectedScreeningId = screeningId;
    this.selectedSeatIds.clear();
    this.loadAvailableSeats(screeningId);
    this.step = 4;
  }

  loadAvailableSeats(screeningId: number): void {
    this.api.getAvailableSeats(screeningId).subscribe({
      next: seats => {
        this.availableSeats = seats;
        this.buildSeatMap();
      },
      error: err => this.setStatus(`Kunne ikke hente ledige sæder. ${this.formatError(err)}`, 'error')
    });
  }

  toggleSeat(seatId: number): void {
    if (this.selectedSeatIds.has(seatId)) {
      this.selectedSeatIds.delete(seatId);
    } else {
      this.selectedSeatIds.add(seatId);
    }
  }

  isSeatSelected(seatId: number): boolean {
    return this.selectedSeatIds.has(seatId);
  }

  goToStep(stepId: number): void {
    if (this.canGoToStep(stepId)) {
      this.step = stepId;
    }
  }

  nextStep(): void {
    if (this.canProceedFromStep(this.step) && this.step < this.steps.length) {
      this.step += 1;
    }
  }

  prevStep(): void {
    if (this.step > 1) {
      this.step -= 1;
    }
  }

  canGoToStep(stepId: number): boolean {
    for (let i = 1; i < stepId; i += 1) {
      if (!this.canProceedFromStep(i)) {
        return false;
      }
    }
    return true;
  }

  canProceedFromStep(stepId: number): boolean {
    switch (stepId) {
      case 1:
        return !!this.selectedFormatId;
      case 2:
        return !!this.selectedMovieId;
      case 3:
        return !!this.selectedScreeningId;
      case 4:
        return this.seatCount > 0;
      case 5:
        return true;
      case 6:
        return this.canConfirmBooking();
      default:
        return false;
    }
  }

  canConfirmBooking(): boolean {
    return !!this.selectedUserId && !!this.selectedScreeningId && this.seatCount > 0;
  }

  async confirmBooking(): Promise<void> {
    if (!this.canConfirmBooking() || !this.selectedScreeningId) {
      this.setStatus('Vælg bruger, tid og mindst 1 sæde.', 'error');
      return;
    }

    const payload = {
      userId: this.selectedUserId!,
      screeningId: this.selectedScreeningId,
      status: 'Pending',
      notes: 'Booked from client'
    };

    try {
      this.setStatus('Opretter booking...', 'info');
      const booking = await firstValueFrom(this.api.createBooking(payload));
      this.bookingResult = booking;

      const seatRequests = Array.from(this.selectedSeatIds).map(seatId =>
        firstValueFrom(
          this.api.addBookingSeat({
            bookingId: booking.id,
            seatId,
            price: this.ticketPrice
          })
        )
      );

      const productRequests = this.selectedProducts.map(item =>
        firstValueFrom(
          this.api.addBookingItem({
            bookingId: booking.id,
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.product.price
          })
        )
      );

      await Promise.all([...seatRequests, ...productRequests]);

      this.setStatus(`Booking gennemført! Booking #${booking.id}`, 'ok');
    } catch (err) {
      this.setStatus(`Kunne ikke gennemføre booking. ${this.formatError(err)}`, 'error');
    }
  }

  async createUserAndSelect(): Promise<void> {
    const payload = {
      email: this.userForm.email.trim(),
      username: this.userForm.username.trim(),
      passwordHash: this.userForm.passwordHash.trim(),
      passwordSalt: this.userForm.passwordSalt.trim(),
      isActive: this.userForm.isActive
    };

    if (!payload.email || !payload.username) {
      this.setStatus('Email og brugernavn er påkrævet.', 'error');
      return;
    }

    try {
      const user = await firstValueFrom(this.api.createUser(payload));
      this.users = [user, ...this.users];
      this.selectedUserId = user.id;
      this.userForm = {
        email: '',
        username: '',
        passwordHash: 'AQIDBAUGBwgJCgsMDQ4PEA==',
        passwordSalt: 'AAECAwQFBgcICQoLDA0ODw==',
        isActive: true
      };
      this.setStatus(`Bruger oprettet: ${user.username}`, 'ok');
    } catch (err) {
      this.setStatus(`Kunne ikke oprette bruger. ${this.formatError(err)}`, 'error');
    }
  }

  createShowFormat(): void {
    const payload = {
      name: this.showFormatForm.name.trim(),
      priceAdd: this.toNumber(this.showFormatForm.priceAdd, 0)
    };

    if (!payload.name) {
      this.setStatus('Format navn er påkrævet.', 'error');
      return;
    }

    this.api.createShowFormat(payload).subscribe({
      next: format => {
        this.showFormats = [format, ...this.showFormats];
        this.showFormatForm = { name: '2D', priceAdd: 0 };
        this.setStatus(`Format oprettet: ${format.name}`, 'ok');
      },
      error: err => this.setStatus(`Kunne ikke oprette format. ${this.formatError(err)}`, 'error')
    });
  }

  createMovie(): void {
    const payload = {
      title: this.movieForm.title.trim(),
      description: this.movieForm.description?.trim() || null,
      durationMinutes: this.toNumber(this.movieForm.durationMinutes, 0),
      ageLimit: this.toNullableNumber(this.movieForm.ageLimit),
      releaseDate: this.movieForm.releaseDate || null
    };

    if (!payload.title) {
      this.setStatus('Film titel er påkrævet.', 'error');
      return;
    }

    this.api.createMovie(payload).subscribe({
      next: movie => {
        this.movies = [movie, ...this.movies];
        this.movieForm = {
          title: '',
          description: '',
          durationMinutes: 120,
          ageLimit: '' as number | '',
          releaseDate: ''
        };
        this.setStatus(`Film oprettet: ${movie.title}`, 'ok');
      },
      error: err => this.setStatus(`Kunne ikke oprette film. ${this.formatError(err)}`, 'error')
    });
  }

  createAuditorium(): void {
    const payload = {
      name: this.auditoriumForm.name.trim(),
      rows: this.toNumber(this.auditoriumForm.rows, 0),
      seatPerRow: this.toNumber(this.auditoriumForm.seatPerRow, 0)
    };

    if (!payload.name) {
      this.setStatus('Sal navn er påkrævet.', 'error');
      return;
    }

    this.api.createAuditorium(payload).subscribe({
      next: auditorium => {
        this.auditoriums = [auditorium, ...this.auditoriums];
        this.auditoriumForm = { name: 'Sal 1', rows: 8, seatPerRow: 10 };
        this.setStatus(`Sal oprettet: ${auditorium.name}`, 'ok');
      },
      error: err => this.setStatus(`Kunne ikke oprette sal. ${this.formatError(err)}`, 'error')
    });
  }

  createSeat(): void {
    const payload = {
      auditoriumId: this.toNumber(this.seatForm.auditoriumId, 0),
      seatRow: this.toNumber(this.seatForm.seatRow, 0),
      seatNumber: this.toNumber(this.seatForm.seatNumber, 0),
      seatType: this.seatForm.seatType.trim() || 'Standard'
    };

    if (!payload.auditoriumId) {
      this.setStatus('Vælg en sal til sædet.', 'error');
      return;
    }

    this.api.createSeat(payload).subscribe({
      next: seat => {
        this.seats = [seat, ...this.seats];
        this.setStatus('Sæde oprettet.', 'ok');
      },
      error: err => this.setStatus(`Kunne ikke oprette sæde. ${this.formatError(err)}`, 'error')
    });
  }

  createScreening(): void {
    const payload = {
      movieId: this.toNumber(this.screeningForm.movieId, 0),
      auditoriumId: this.toNumber(this.screeningForm.auditoriumId, 0),
      showFormatId: this.toNumber(this.screeningForm.showFormatId, 0),
      startsAt: this.screeningForm.startsAt,
      baseTicketPrice: this.toNumber(this.screeningForm.baseTicketPrice, 0)
    };

    if (!payload.movieId || !payload.auditoriumId || !payload.showFormatId || !payload.startsAt) {
      this.setStatus('Udfyld film, sal, format og tidspunkt.', 'error');
      return;
    }

    this.api.createScreening(payload).subscribe({
      next: screening => {
        this.screenings = [screening, ...this.screenings];
        this.screeningForm = {
          movieId: 0,
          auditoriumId: 0,
          showFormatId: 0,
          startsAt: '',
          baseTicketPrice: 120
        };
        this.setStatus('Forestilling oprettet.', 'ok');
      },
      error: err => this.setStatus(`Kunne ikke oprette forestilling. ${this.formatError(err)}`, 'error')
    });
  }

  createProduct(): void {
    const payload = {
      name: this.productForm.name.trim(),
      category: this.productForm.category.trim(),
      price: this.toNumber(this.productForm.price, 0),
      isActive: this.productForm.isActive
    };

    if (!payload.name) {
      this.setStatus('Produkt navn er påkrævet.', 'error');
      return;
    }

    this.api.createProduct(payload).subscribe({
      next: product => {
        this.products = [product, ...this.products];
        this.productForm = {
          name: '',
          category: 'Drink',
          price: 0,
          isActive: true
        };
        this.productQuantities[product.id] = 0;
        this.setStatus(`Produkt oprettet: ${product.name}`, 'ok');
      },
      error: err => this.setStatus(`Kunne ikke oprette produkt. ${this.formatError(err)}`, 'error')
    });
  }

  private buildSeatMap(): void {
    const rows = Array.from(new Set(this.availableSeats.map(seat => seat.seatRow))).sort((a, b) => a - b);
    const byRow: Record<number, Seat[]> = {};
    for (const row of rows) {
      byRow[row] = this.availableSeats
        .filter(seat => seat.seatRow === row)
        .sort((a, b) => a.seatNumber - b.seatNumber);
    }
    this.seatRows = rows;
    this.seatsByRow = byRow;
  }

  private getQuantity(productId: number): number {
    const value = Number(this.productQuantities[productId] ?? 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  private toNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private toNullableNumber(value: unknown): number | null {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private setStatus(message: string, type: StatusType): void {
    this.statusMessage = message;
    this.statusType = type;
  }

  private formatError(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object') {
      const anyError = error as { message?: string; error?: unknown };
      if (typeof anyError.error === 'string') {
        return anyError.error;
      }
      if (anyError.error && typeof anyError.error === 'object') {
        const errorObj = anyError.error as { title?: string };
        if (errorObj.title) {
          return errorObj.title;
        }
      }
      if (anyError.message) {
        return anyError.message;
      }
    }

    return 'Unknown error.';
  }
}
