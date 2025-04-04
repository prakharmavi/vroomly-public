import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  serverTimestamp, 
  
  orderBy
} from "firebase/firestore";
import db from "../firestore";
import { Booking, BookingData, BookingResult, BookingStatus } from "../model/bookingmodel";
import { User } from "firebase/auth";

/**
 * Creates a new booking in Firestore
 * @param bookingData The booking data to be added
 * @param user The authenticated user creating the booking
 * @returns Promise with the result of the operation
 */
export async function createBooking(
  bookingData: BookingData, 
  user: User
): Promise<BookingResult> {
  try {
    // Verify the user is authenticated
    if (!user || !user.uid) {
      return {
        success: false,
        error: "User must be authenticated to create a booking"
      };
    }

    // Ensure the renter ID matches the current user
    if (bookingData.renterId !== user.uid) {
      bookingData.renterId = user.uid; // Force the renter to be the current user
    }

    // Prepare the Firestore document
    const firestoreData = {
      ...bookingData,
      // Convert JavaScript Dates to Firestore Timestamps
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: BookingStatus.PENDING // Default status for new bookings
    };

    // Add the document to Firestore
    const docRef = await addDoc(collection(db, "bookings"), firestoreData);

    return {
      success: true,
      id: docRef.id
    };
  } catch (error) {
    console.error("Error adding booking:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create booking"
    };
  }
}

/**
 * Gets a booking by ID
 * @param bookingId The booking ID to fetch
 * @returns Promise with the booking data or null if not found
 */
export async function getBookingById(bookingId: string): Promise<Booking | null> {
  try {
    const docRef = doc(db, "bookings", bookingId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Booking;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching booking:", error);
    throw error;
  }
}

/**
 * Gets all bookings where the user is the renter
 * @param userId The user ID
 * @returns Promise with an array of bookings
 */
export async function getBookingsByRenter(userId: string): Promise<Booking[]> {
  try {
    try {
      // First try with ordering (requires index)
      const q = query(
        collection(db, "bookings"), 
        where("renterId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      const bookings: Booking[] = [];
      querySnapshot.forEach((doc) => {
        bookings.push({
          id: doc.id,
          ...doc.data()
        } as Booking);
      });
      
      return bookings;
    } catch (indexError) {
      // Fallback query without ordering if index doesn't exist
      console.warn("Index not found, using fallback query without ordering:", indexError);
      
      const simpleQ = query(
        collection(db, "bookings"), 
        where("renterId", "==", userId)
      );
      const querySnapshot = await getDocs(simpleQ);
      
      const bookings: Booking[] = [];
      querySnapshot.forEach((doc) => {
        bookings.push({
          id: doc.id,
          ...doc.data()
        } as Booking);
      });
      
      // Sort the results client-side
      return bookings.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime; // descending order
      });
    }
  } catch (error) {
    console.error("Error fetching bookings by renter:", error);
    throw error;
  }
}

/**
 * Gets all bookings where the user is the car owner
 * @param userId The user ID
 * @returns Promise with an array of bookings
 */
export async function getBookingsByOwner(userId: string): Promise<Booking[]> {
  try {
    try {
      // First try with ordering (requires index)
      const q = query(
        collection(db, "bookings"), 
        where("ownerId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      const bookings: Booking[] = [];
      querySnapshot.forEach((doc) => {
        bookings.push({
          id: doc.id,
          ...doc.data()
        } as Booking);
      });
      
      return bookings;
    } catch (indexError) {
      // Fallback query without ordering if index doesn't exist
      console.warn("Index not found, using fallback query without ordering:", indexError);
      
      const simpleQ = query(
        collection(db, "bookings"), 
        where("ownerId", "==", userId)
      );
      const querySnapshot = await getDocs(simpleQ);
      
      const bookings: Booking[] = [];
      querySnapshot.forEach((doc) => {
        bookings.push({
          id: doc.id,
          ...doc.data()
        } as Booking);
      });
      
      // Sort the results client-side
      return bookings.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime; // descending order
      });
    }
  } catch (error) {
    console.error("Error fetching bookings by owner:", error);
    throw error;
  }
}

/**
 * Updates the status of a booking
 * @param bookingId The booking ID
 * @param status The new status
 * @param user The authenticated user updating the booking
 * @param reason Optional reason for status change (e.g., rejection or cancellation reason)
 * @returns Promise with the result of the operation
 */
export async function updateBookingStatus(
  bookingId: string, 
  status: BookingStatus,
  user: User,
  reason?: string
): Promise<BookingResult> {
  try {
    // Verify the user is authenticated
    if (!user || !user.uid) {
      return {
        success: false,
        error: "User must be authenticated to update a booking"
      };
    }

    // Get the current booking to check permissions
    const booking = await getBookingById(bookingId);
    
    if (!booking) {
      return {
        success: false,
        error: "Booking not found"
      };
    }

    // Verify that the current user is either the owner or the renter
    if (booking.ownerId !== user.uid && booking.renterId !== user.uid) {
      return {
        success: false,
        error: "You don't have permission to update this booking"
      };
    }

    // Different status updates have different permission requirements
    if (status === BookingStatus.APPROVED || status === BookingStatus.REJECTED) {
      // Only the owner can approve or reject
      if (booking.ownerId !== user.uid) {
        return {
          success: false,
          error: "Only the car owner can approve or reject bookings"
        };
      }
    } else if (status === BookingStatus.CANCELED) {
      // Both the renter and owner can cancel, but we should track who did it
      // (We'd need to add a "canceledBy" field for this, but keeping it simple for now)
    }

    // Prepare the update data
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    };

    // Add reason if provided
    if (reason) {
      updateData.cancellationReason = reason;
    }

    // Update the document in Firestore
    const docRef = doc(db, "bookings", bookingId);
    await updateDoc(docRef, updateData);

    return {
      success: true,
      id: bookingId
    };
  } catch (error) {
    console.error("Error updating booking status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update booking status"
    };
  }
}

/**
 * Gets bookings for a specific car
 * @param carId The car ID
 * @returns Promise with an array of bookings
 */
export async function getBookingsByCar(carId: string): Promise<Booking[]> {
  try {
    const q = query(
      collection(db, "bookings"), 
      where("carId", "==", carId),
      where("status", "in", [BookingStatus.APPROVED, BookingStatus.PENDING])
    );
    const querySnapshot = await getDocs(q);
    
    const bookings: Booking[] = [];
    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      } as Booking);
    });
    
    return bookings;
  } catch (error) {
    console.error("Error fetching bookings by car:", error);
    throw error;
  }
}
