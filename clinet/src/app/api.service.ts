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
  constructor(private http: HttpClient) {}

  getMovies() {
    return this.http.get<Movie[]>(`${API_BASE_URL}/movies`);
  }

  getShowFormats() {
    return this.http.get<ShowFormat[]>(`${API_BASE_URL}/showformats`);
  }

  createShowFormat(payload: Omit<ShowFormat, 'id'>) {
    return this.http.post<ShowFormat>(`${API_BASE_URL}/showformats`, payload);
  }

  getAuditoriums() {
    return this.http.get<Auditorium[]>(`${API_BASE_URL}/auditoriums`);
  }

  createAuditorium(payload: Omit<Auditorium, 'id'>) {
    return this.http.post<Auditorium>(`${API_BASE_URL}/auditoriums`, payload);
  }

  getSeats() {
    return this.http.get<Seat[]>(`${API_BASE_URL}/seats`);
  }

  createSeat(payload: Omit<Seat, 'id'>) {
    return this.http.post<Seat>(`${API_BASE_URL}/seats`, payload);
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

  getBookings() {
    return this.http.get<Booking[]>(`${API_BASE_URL}/bookings`);
  }

  createBooking(payload: {
    userId: number;
    screeningId: number;
    status: string;
    notes?: string | null;
  }) {
    return this.http.post<Booking>(`${API_BASE_URL}/bookings`, payload);
  }

  addBookingSeat(payload: BookingSeat) {
    return this.http.post<void>(`${API_BASE_URL}/bookingseats`, payload);
  }

  addBookingItem(payload: BookingItem) {
    return this.http.post<void>(`${API_BASE_URL}/bookingitems`, payload);
  }
}
