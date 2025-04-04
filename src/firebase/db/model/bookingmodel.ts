import { Timestamp } from "firebase/firestore";

/**
 * Represents the status of a booking
 */
export enum BookingStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed",
  CANCELED = "canceled"
}

/**
 * Represents a booking in the system
 */
export interface Booking {
  id: string;
  carId: string;
  carTitle: string; // For easier reference without fetching car details
  carImageUrl: string; // Main image of the car
  renterId: string; // User who is booking the car
  renterName: string;
  renterProfileImage?: string;
  ownerId: string; // User who owns the car
  ownerName: string;
  startDate: Timestamp;
  endDate: Timestamp;
  totalPrice: number;
  status: BookingStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  cancellationReason?: string;
  notes?: string; // Additional notes from the renter
}

/**
 * Data required to create a new booking
 */
export interface BookingData {
  carId: string;
  carTitle: string;
  carImageUrl: string;
  renterId: string;
  renterName: string;
  renterProfileImage?: string;
  ownerId: string;
  ownerName: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  status: BookingStatus;
  notes?: string;
}

/**
 * Result of booking operations
 */
export interface BookingResult {
  success: boolean;
  id?: string;
  error?: string;
}
