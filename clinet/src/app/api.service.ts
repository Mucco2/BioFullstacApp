import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Booking,
  BookingItem,
  BookingSeat,
  Auditorium,
  Movie,
  Product,
  ShowFormat,
  Screening,
  Seat,
  User
} from './models';
import { API_BASE_URL } from './app.constants';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly tokenKey = 'bioapp_token';

  constructor(private http: HttpClient) {}

  setToken(token: string | null) {
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    } else {
      localStorage.removeItem(this.tokenKey);
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private authHeaders() {
    const token = this.getToken();
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }

  login(payload: { emailOrUsername: string; password: string }) {
    return this.http.post<{ token: string; user: User }>(`${API_BASE_URL}/auth/login`, payload);
  }

  register(payload: { email: string; username: string; password: string }) {
    return this.http.post<{ token: string; user: User }>(`${API_BASE_URL}/auth/register`, payload);
  }

  getMovies() {
    return this.http.get<Movie[]>(`${API_BASE_URL}/movies`);
  }

  getShowFormats() {
    return this.http.get<ShowFormat[]>(`${API_BASE_URL}/showformats`);
  }

  createShowFormat(payload: Omit<ShowFormat, 'id'>) {
    return this.http.post<ShowFormat>(`${API_BASE_URL}/showformats`, payload);
  }

  updateShowFormat(id: number, payload: ShowFormat) {
    return this.http.put<void>(`${API_BASE_URL}/showformats/${id}`, payload);
  }

  deleteShowFormat(id: number) {
    return this.http.delete<void>(`${API_BASE_URL}/showformats/${id}`);
  }

  getAuditoriums() {
    return this.http.get<Auditorium[]>(`${API_BASE_URL}/auditoriums`);
  }

  createAuditorium(payload: Omit<Auditorium, 'id'>) {
    return this.http.post<Auditorium>(`${API_BASE_URL}/auditoriums`, payload);
  }

  updateAuditorium(id: number, payload: Auditorium) {
    return this.http.put<void>(`${API_BASE_URL}/auditoriums/${id}`, payload);
  }

  deleteAuditorium(id: number) {
    return this.http.delete<void>(`${API_BASE_URL}/auditoriums/${id}`);
  }

  getSeats() {
    return this.http.get<Seat[]>(`${API_BASE_URL}/seats`);
  }

  createSeat(payload: Omit<Seat, 'id'>) {
    return this.http.post<Seat>(`${API_BASE_URL}/seats`, payload);
  }

  updateSeat(id: number, payload: Seat) {
    return this.http.put<void>(`${API_BASE_URL}/seats/${id}`, payload);
  }

  deleteSeat(id: number) {
    return this.http.delete<void>(`${API_BASE_URL}/seats/${id}`);
  }

  createMovie(payload: Omit<Movie, 'id'>) {
    return this.http.post<Movie>(`${API_BASE_URL}/movies`, payload);
  }

  updateMovie(id: number, payload: Movie) {
    return this.http.put<Movie>(`${API_BASE_URL}/movies/${id}`, payload);
  }

  deleteMovie(id: number) {
    return this.http.delete<void>(`${API_BASE_URL}/movies/${id}`);
  }

  getScreenings() {
    return this.http.get<Screening[]>(`${API_BASE_URL}/screenings`);
  }

  createScreening(payload: Omit<Screening, 'id'>) {
    return this.http.post<Screening>(`${API_BASE_URL}/screenings`, payload);
  }

  updateScreening(id: number, payload: Screening) {
    return this.http.put<void>(`${API_BASE_URL}/screenings/${id}`, payload);
  }

  deleteScreening(id: number) {
    return this.http.delete<void>(`${API_BASE_URL}/screenings/${id}`);
  }

  getScreeningsByMovieDate(movieId: number, date: string) {
    const query = `movieId=${movieId}&date=${encodeURIComponent(date)}`;
    return this.http.get<Screening[]>(`${API_BASE_URL}/screenings/by-movie-date?${query}`);
  }

  getAvailableSeats(screeningId: number) {
    return this.http.get<Seat[]>(`${API_BASE_URL}/screenings/${screeningId}/available-seats`);
  }

  getUsers() {
    return this.http.get<User[]>(`${API_BASE_URL}/users`);
  }

  createUser(payload: {
    email: string;
    username: string;
    passwordHash: string;
    passwordSalt: string;
    isActive: boolean;
  }) {
    return this.http.post<User>(`${API_BASE_URL}/users`, payload);
  }

  getProducts() {
    return this.http.get<Product[]>(`${API_BASE_URL}/products`);
  }

  createProduct(payload: Omit<Product, 'id'>) {
    return this.http.post<Product>(`${API_BASE_URL}/products`, payload);
  }

  updateProduct(id: number, payload: Product) {
    return this.http.put<void>(`${API_BASE_URL}/products/${id}`, payload);
  }

  deleteProduct(id: number) {
    return this.http.delete<void>(`${API_BASE_URL}/products/${id}`);
  }

  getBookings() {
    return this.http.get<Booking[]>(`${API_BASE_URL}/bookings`);
  }

  createBooking(payload: {
    userId: number;
    screeningId: number;
    status: string;
    notes?: string | null;
  }) {
    return this.http.post<Booking>(`${API_BASE_URL}/bookings`, payload, this.authHeaders());
  }

  addBookingSeat(payload: BookingSeat) {
    return this.http.post<void>(`${API_BASE_URL}/bookingseats`, payload, this.authHeaders());
  }

  addBookingItem(payload: BookingItem) {
    return this.http.post<void>(`${API_BASE_URL}/bookingitems`, payload, this.authHeaders());
  }
}
