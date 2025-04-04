import { Timestamp } from "firebase/firestore";
import { User } from "firebase/auth";

/**
 * Represents the basic information about a car
 */
export interface CarInfo {
  make: string;           // Car manufacturer (e.g. Toyota, Tesla)
  model: string;          // Car model (e.g. Camry, Model 3)
  year: number;           // Manufacturing year
  color: string;          // Car color
  fuelType: FuelType;     // Type of fuel used
  transmission: TransmissionType;  // Transmission type
  seats: number;          // Number of seats
  licensePlate?: string;  // Optional license plate (might be hidden from public)
}

/**
 * Type of fuel used by the vehicle
 */
export enum FuelType {
  GASOLINE = "gasoline",
  DIESEL = "diesel",
  ELECTRIC = "electric",
  HYBRID = "hybrid",
  PLUGIN_HYBRID = "plugin_hybrid",
}

/**
 * Type of transmission in the vehicle
 */
export enum TransmissionType {
  AUTOMATIC = "automatic",
  MANUAL = "manual",
}

/**
 * Represents a car listing in the application
 */
export interface CarListing {
  id: string;             // Unique identifier for the car listing
  owner: string;          // User ID of the car owner
  title: string;          // Listing title
  description: string;    // Detailed description
  carInfo: CarInfo;       // Car details
  price: number;          // Daily rental price
  location: string;       // Location (city, state)
  imageUrl: string;       // Main image URL
  additionalImages?: string[]; // Optional additional images
  availableFrom: Timestamp; // Start of availability period
  availableTo: Timestamp;  // End of availability period
  createdAt: Timestamp;   // When the listing was created
  updatedAt: Timestamp;   // When the listing was last updated
  features: string[];     // List of car features
  restrictions?: string[]; // Optional rental restrictions
  status: ListingStatus;  // Current status of the listing
}

/**
 * Status of a car listing
 */
export enum ListingStatus {
  ACTIVE = "active",
  RENTED = "rented",
  MAINTENANCE = "maintenance",
  INACTIVE = "inactive",
}

/**
 * Data needed to create a new car listing
 */
export interface CarListingData {
  owner: string;
  title: string;
  description: string;
  carInfo: CarInfo;
  price: number;
  location: string;
  
  imageUrls: string[]; // Array to store multiple image URLs
  additionalImages?: string[];
  availableFrom: Date;
  availableTo: Date;
  features?: string[];
  restrictions?: string[];
}

/**
 * Filters for searching cars
 */
export interface CarSearchFilters {
  location?: string;
  priceMin?: number;
  priceMax?: number;
  make?: string;
  fuelType?: FuelType;
  transmission?: TransmissionType;
  seatsMin?: number;
  availableFrom?: Date;
  availableTo?: Date;
}

/**
 * Helper function to create a new car listing
 */
export function createCarListingData(data: Partial<CarListingData>, user: User): CarListingData {
  return {
    owner: user.uid,
    title: data.title || "",
    description: data.description || "",
    carInfo: data.carInfo || {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      color: "",
      fuelType: FuelType.GASOLINE,
      transmission: TransmissionType.AUTOMATIC,
      seats: 5,
    },
    price: data.price || 0,
    location: data.location || "",
    imageUrls: data.imageUrls || [],
    additionalImages: data.additionalImages || [],
    availableFrom: data.availableFrom || new Date(),
    availableTo: data.availableTo || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default: 30 days from now
    features: data.features || [],
    restrictions: data.restrictions || [],
  };
}
