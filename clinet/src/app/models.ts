export interface Movie {
  id: number;
  title: string;
  description?: string | null;
  durationMinutes: number;
  ageLimit?: number | null;
  releaseDate?: string | null;
}

export interface ShowFormat {
  id: number;
  name: string;
  priceAdd: number;
}

export interface Auditorium {
  id: number;
  name: string;
  rows: number;
  seatPerRow: number;
}

export interface Screening {
  id: number;
  movieId: number;
  auditoriumId: number;
  showFormatId: number;
  startsAt: string;
  baseTicketPrice: number;
}

export interface Seat {
  id: number;
  auditoriumId: number;
  seatRow: number;
  seatNumber: number;
  seatType: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  isActive: boolean;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  isActive: boolean;
}

export interface Booking {
  id: number;
  userId: number;
  screeningId: number;
  status: string;
  notes?: string | null;
  createdAt?: string;
}

export interface BookingSeat {
  bookingId: number;
  seatId: number;
  price: number;
}

export interface BookingItem {
  id?: number;
  bookingId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
}
