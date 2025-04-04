import { doc, deleteDoc } from "firebase/firestore";
import db from "../firestore";
import { User } from "firebase/auth";
import { getCarListingById } from "./getCarListings";

// Define the structure of a car listing
interface CarListing {
  id: string;
  owner: string;
  // Other properties would go here
}

interface DeleteCarListingResult {
  success: boolean;
  error?: string; // Error message if unsuccessful
}

/**
 * Deletes a car listing from Firestore
 * @param listingId The ID of the car listing to delete
 * @param user The authenticated user deleting the listing
 * @returns Promise with the result of the operation
 */
export async function deleteCarListing(
  listingId: string,
  user: User
): Promise<DeleteCarListingResult> {
  try {
    // Verify the user is authenticated
    if (!user || !user.uid) {
      return {
        success: false,
        error: "User must be authenticated to delete a car listing"
      };
    }

    // First, get the current listing to check ownership
    const currentListing = await getCarListingById(listingId) as CarListing;
    
    if (!currentListing) {
      return {
        success: false,
        error: "Car listing not found"
      };
    }
    
    // Verify that the current user owns this listing
    if (currentListing.owner !== user.uid) {
      return {
        success: false,
        error: "You don't have permission to delete this car listing"
      };
    }

    // Delete the document from Firestore
    const docRef = doc(db, "carListings", listingId);
    await deleteDoc(docRef);

    return {
      success: true
    };
  } catch (error) {
    console.error("Error deleting car listing:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete car listing"
    };
  }
}
