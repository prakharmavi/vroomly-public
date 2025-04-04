import { collection, addDoc, serverTimestamp } from "firebase/firestore"; 
import db from "../firestore";
import { CarListingData, ListingStatus } from "../model/carmodel";
import { User } from "firebase/auth";
import { updateCarListing } from "./updateCarListing"; // Import the new function

interface AddCarListingResult {
  success: boolean;
  id?: string; // Document ID if successful
  error?: string; // Error message if unsuccessful
}

/**
 * Adds a new car listing to Firestore
 * @param listingData The car listing data to be added
 * @param user The authenticated user adding the listing
 * @returns Promise with the result of the operation
 */
export async function addCarListing(
  listingData: CarListingData, 
  user: User
): Promise<AddCarListingResult> {
  try {
    // Verify the user is authenticated
    if (!user || !user.uid) {
      return {
        success: false,
        error: "User must be authenticated to add a car listing"
      };
    }

    // Ensure the owner ID matches the current user
    if (listingData.owner !== user.uid) {
      listingData.owner = user.uid; // Force the owner to be the current user
    }

    // Prepare the Firestore document
    const firestoreData = {
      ...listingData,
      // Convert JavaScript Dates to Firestore Timestamps
      availableFrom: listingData.availableFrom,
      availableTo: listingData.availableTo,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: ListingStatus.ACTIVE // Set default status to active
    };

    // Add the document to Firestore
    const docRef = await addDoc(collection(db, "carListings"), firestoreData);

    return {
      success: true,
      id: docRef.id
    };
  } catch (error) {
    console.error("Error adding car listing:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add car listing"
    };
  }
}

// Re-export the updateCarListing function
export { updateCarListing };
