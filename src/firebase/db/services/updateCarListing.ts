import { doc, updateDoc, serverTimestamp } from "firebase/firestore"; 
import db from "../firestore";
import { CarListingData } from "../model/carmodel";
import { User } from "firebase/auth";
import { getCarListingById } from "./getCarListings";

interface UpdateCarListingResult {
  success: boolean;
  id?: string; // Document ID if successful
  error?: string; // Error message if unsuccessful
}

/**
 * Updates an existing car listing in Firestore
 * @param listingId The ID of the car listing to update
 * @param listingData The updated car listing data
 * @param user The authenticated user updating the listing
 * @returns Promise with the result of the operation
 */
export async function updateCarListing(
  listingId: string,
  listingData: CarListingData, 
  user: User
): Promise<UpdateCarListingResult> {
  try {
    // Verify the user is authenticated
    if (!user || !user.uid) {
      return {
        success: false,
        error: "User must be authenticated to update a car listing"
      };
    }

    // First, get the current listing to check ownership
    const currentListing = await getCarListingById(listingId);
    
    if (!currentListing) {
      return {
        success: false,
        error: "Car listing not found"
      };
    }
    
    // Verify that the current user owns this listing
    const listing = currentListing as unknown as CarListingData;
    if (listing.owner !== user.uid) {
      return {
        success: false,
        error: "You don't have permission to update this car listing"
      };
    }

    // Ensure the owner ID matches the current user and cannot be changed
    if (listingData.owner !== user.uid) {
      listingData.owner = user.uid; // Force the owner to be the current user
    }

    // Prepare the Firestore document
    const firestoreData = {
      ...listingData,
      // Convert JavaScript Dates to Firestore timestamps
      availableFrom: listingData.availableFrom instanceof Date ? 
        new Date(listingData.availableFrom) : listingData.availableFrom,
      availableTo: listingData.availableTo instanceof Date ? 
        new Date(listingData.availableTo) : listingData.availableTo,
      updatedAt: serverTimestamp()
    };

    // Update the document in Firestore
    const docRef = doc(db, "carListings", listingId);
    await updateDoc(docRef, firestoreData);

    return {
      success: true,
      id: listingId
    };
  } catch (error) {
    console.error("Error updating car listing:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update car listing"
    };
  }
}
