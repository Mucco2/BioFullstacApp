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
type PaymentStatus = 'idle' | 'processing' | 'paid' | 'error';

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

  statusMessage = 'Log ind for at se film og starte din booking.';
  statusType: StatusType = 'info';

  viewMode: ViewMode = 'booking';

  private readonly userKey = 'bioapp_user';
  authUser: User | null = null;
  authMode: 'login' | 'register' = 'login';
  loginForm = {
    emailOrUsername: '',
    password: ''
  };
  registerForm = {
    email: '',
    username: '',
    password: ''
  };

  steps: Step[] = [
    { id: 1, label: 'Format' },
    { id: 2, label: 'Film' },
    { id: 3, label: 'Sal' },
    { id: 4, label: 'Tid' },
    { id: 5, label: 'Plads' },
    { id: 6, label: 'Mad/Drikke' },
    { id: 7, label: 'Opsummering' }
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
  selectedAuditoriumId: number | null = null;
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
  paymentStatus: PaymentStatus = 'idle';
  paymentError = '';
  paymentReference = '';
  paymentForm = {
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvc: ''
  };

  showFormatForm = {
    name: '2D',
    priceAdd: 0
  };

  movieForm = {
    title: '',
    description: '',
    durationMinutes: 120,
    ageLimit: '' as number | '',
    releaseDate: '',
    imageUrl: ''
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
    this.restoreSession();
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

    this.api.getAuditoriums().subscribe({
      next: auditoriums => (this.auditoriums = auditoriums),
      error: err => this.setStatus(`Kunne ikke hente sale. ${this.formatError(err)}`, 'error')
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

  get isAuthenticated(): boolean {
    return !!this.authUser;
  }

  restoreSession(): void {
    const token = this.api.getToken();
    const userRaw = localStorage.getItem(this.userKey);
    if (!token || !userRaw) {
      return;
    }

    try {
      const user = JSON.parse(userRaw) as User;
      if (user && user.id) {
        this.authUser = user;
        this.selectedUserId = user.id;
      }
    } catch {
      this.api.setToken(null);
      localStorage.removeItem(this.userKey);
    }
  }

  login(): void {
    const payload = {
      emailOrUsername: this.loginForm.emailOrUsername.trim(),
      password: this.loginForm.password
    };

    if (!payload.emailOrUsername || !payload.password) {
      this.setStatus('Udfyld login oplysninger.', 'error');
      return;
    }

    this.api.login(payload).subscribe({
      next: res => {
        this.api.setToken(res.token);
        this.authUser = res.user;
        localStorage.setItem(this.userKey, JSON.stringify(res.user));
        this.selectedUserId = res.user.id;
        this.loginForm = { emailOrUsername: '', password: '' };
        this.setStatus(`Logget ind som ${res.user.username}`, 'ok');
        this.loadInitialData();
        this.step = 1;
      },
      error: err => this.setStatus(`Login fejlede. ${this.formatError(err)}`, 'error')
    });
  }

  register(): void {
    const payload = {
      email: this.registerForm.email.trim().toLowerCase(),
      username: this.registerForm.username.trim(),
      password: this.registerForm.password
    };

    if (!payload.email || !payload.username || !payload.password) {
      this.setStatus('Udfyld email, brugernavn og password.', 'error');
      return;
    }

    this.api.register(payload).subscribe({
      next: res => {
        this.api.setToken(res.token);
        this.authUser = res.user;
        localStorage.setItem(this.userKey, JSON.stringify(res.user));
        this.selectedUserId = res.user.id;
        this.registerForm = { email: '', username: '', password: '' };
        this.setStatus(`Bruger oprettet og logget ind som ${res.user.username}`, 'ok');
        this.loadInitialData();
        this.step = 1;
      },
      error: err => this.setStatus(`Kunne ikke oprette bruger. ${this.formatError(err)}`, 'error')
    });
  }

  logout(): void {
    this.api.setToken(null);
    localStorage.removeItem(this.userKey);
    this.authUser = null;
    this.selectedUserId = null;
    this.selectedFormatId = null;
    this.selectedMovieId = null;
    this.selectedAuditoriumId = null;
    this.selectedScreeningId = null;
    this.selectedSeatIds.clear();
    this.availableSeats = [];
    this.seatRows = [];
    this.seatsByRow = {};
    this.paymentStatus = 'idle';
    this.paymentError = '';
    this.paymentReference = '';
    this.bookingResult = null;
    this.setStatus('Du er logget ud.', 'info');
    this.step = 1;
  }

  get selectedFormat(): ShowFormat | undefined {
    return this.showFormats.find(format => format.id === this.selectedFormatId!);
  }

  get selectedMovie(): Movie | undefined {
    return this.movies.find(movie => movie.id === this.selectedMovieId!);
  }

  get selectedAuditorium(): Auditorium | undefined {
    return this.auditoriums.find(auditorium => auditorium.id === this.selectedAuditoriumId!);
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

  get filteredAuditoriums(): Auditorium[] {
    if (!this.selectedFormatId || !this.selectedMovieId) {
      return [];
    }
    const auditoriumIds = new Set(
      this.screenings
        .filter(
          screening =>
            screening.showFormatId === this.selectedFormatId && screening.movieId === this.selectedMovieId
        )
        .map(screening => screening.auditoriumId)
    );
    return this.auditoriums.filter(auditorium => auditoriumIds.has(auditorium.id));
  }

  get filteredScreenings(): Screening[] {
    if (!this.selectedFormatId || !this.selectedMovieId || !this.selectedAuditoriumId) {
      return [];
    }
    return this.screenings
      .filter(
        screening =>
          screening.showFormatId === this.selectedFormatId && screening.movieId === this.selectedMovieId
          && screening.auditoriumId === this.selectedAuditoriumId
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
    this.selectedAuditoriumId = null;
    this.selectedScreeningId = null;
    this.availableSeats = [];
    this.seatRows = [];
    this.seatsByRow = {};
    this.selectedSeatIds.clear();
    this.resetCheckout();
    this.step = 2;
  }

  selectMovie(movieId: number): void {
    if (this.selectedMovieId === movieId) {
      return;
    }
    this.selectedMovieId = movieId;
    this.selectedAuditoriumId = null;
    this.selectedScreeningId = null;
    this.availableSeats = [];
    this.seatRows = [];
    this.seatsByRow = {};
    this.selectedSeatIds.clear();
    this.resetCheckout();
    this.step = 3;
  }

  selectAuditorium(auditoriumId: number): void {
    if (this.selectedAuditoriumId === auditoriumId) {
      return;
    }
    this.selectedAuditoriumId = auditoriumId;
    this.selectedScreeningId = null;
    this.availableSeats = [];
    this.seatRows = [];
    this.seatsByRow = {};
    this.selectedSeatIds.clear();
    this.resetCheckout();
    this.step = 4;
  }

  selectScreening(screeningId: number): void {
    this.selectedScreeningId = screeningId;
    this.selectedSeatIds.clear();
    this.loadAvailableSeats(screeningId);
    this.resetCheckout();
    this.step = 5;
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
        return !!this.selectedAuditoriumId;
      case 4:
        return !!this.selectedScreeningId;
      case 5:
        return this.seatCount > 0;
      case 6:
        return true;
      case 7:
        return this.canConfirmBooking();
      default:
        return false;
    }
  }

  canConfirmBooking(): boolean {
    return this.isAuthenticated && !!this.selectedUserId && !!this.selectedScreeningId && this.seatCount > 0;
  }

  async payAndConfirm(): Promise<void> {
    if (!this.canConfirmBooking() || !this.selectedScreeningId) {
      this.setStatus('Vælg bruger, tid og mindst 1 sæde.', 'error');
      return;
    }

    const validation = this.validatePayment();
    if (validation) {
      this.paymentStatus = 'error';
      this.paymentError = validation;
      this.setStatus(validation, 'error');
      return;
    }

    this.paymentStatus = 'processing';
    this.paymentError = '';
    this.setStatus('Behandler betaling...', 'info');

    const booking = await this.placeBooking();
    if (!booking) {
      this.paymentStatus = 'error';
      return;
    }

    this.paymentStatus = 'paid';
    this.paymentReference = this.generatePaymentReference();
    this.setStatus(`Betaling gennemført! Booking #${booking.id}`, 'ok');
  }

  private validatePayment(): string | null {
    const cardName = this.paymentForm.cardName.trim();
    const cardNumber = this.paymentForm.cardNumber.replace(/\s+/g, '');
    const expiry = this.paymentForm.expiry.trim();
    const cvc = this.paymentForm.cvc.trim();

    if (!cardName || !cardNumber || !expiry || !cvc) {
      return 'Udfyld alle betalingsfelter.';
    }

    if (!/^\d{12,19}$/.test(cardNumber)) {
      return 'Kortnummer skal være 12-19 cifre.';
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      return 'Udløb skal være i formatet MM/YY.';
    }

    if (!/^\d{3,4}$/.test(cvc)) {
      return 'CVC skal være 3-4 cifre.';
    }

    return null;
  }

  private generatePaymentReference(): string {
    const part = Math.floor(Math.random() * 900000 + 100000);
    return `PAY-${part}`;
  }

  private async placeBooking(): Promise<Booking | null> {
    if (!this.selectedScreeningId) {
      return null;
    }

    const payload = {
      userId: this.selectedUserId!,
      screeningId: this.selectedScreeningId,
      status: 'Paid',
      notes: 'Paid online'
    };

    try {
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

      return booking;
    } catch (err) {
      this.setStatus(`Kunne ikke gennemføre booking. ${this.formatError(err)}`, 'error');
      return null;
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
      releaseDate: this.movieForm.releaseDate || null,
      imageUrl: this.movieForm.imageUrl?.trim() || null
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
          releaseDate: '',
          imageUrl: ''
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

  private resetCheckout(): void {
    this.bookingResult = null;
    this.paymentStatus = 'idle';
    this.paymentError = '';
    this.paymentReference = '';
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
