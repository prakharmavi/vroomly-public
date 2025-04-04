import { collection, doc, getDoc, getDocs, query, where, orderBy, limit as limitQuery, QueryConstraint, DocumentData } from "firebase/firestore";
import db from "../firestore";
import { ListingStatus } from "../model/carmodel";

/**
 * Fetches a single car listing by ID
 * @param id The ID of the car listing to fetch
 * @returns The car listing or null if not found
 */
export async function getCarListingById(id: string) {
  try {
    const docRef = doc(db, "carListings", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching car listing:", error);
    throw error;
  }
}

/**
 * Interface for car listing search options
 */
export interface CarListingsOptions {
  status?: ListingStatus;
  ownerId?: string;
  availableNow?: boolean;
  limitResults?: number;
  sortBy?: 'price' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Fetches car listings based on provided options
 * @param options Search and filter options
 * @returns Array of car listings
 */
export async function getCarListings(options: CarListingsOptions = {}) {
  try {
    const constraints: QueryConstraint[] = [];
    
    // Add filter for listing status
    if (options.status) {
      constraints.push(where("status", "==", options.status));
    } else {
      // Default to active listings only
      constraints.push(where("status", "==", ListingStatus.ACTIVE));
    }
    
    // Add filter for owner ID
    if (options.ownerId) {
      constraints.push(where("owner", "==", options.ownerId));
    }
    
    // Add sorting - NOTE: In Firestore, we can only use inequality filters on fields that match the first orderBy
    const sortField = options.sortBy || 'createdAt';
    const sortDirection = options.sortDirection || 'desc';
    constraints.push(orderBy(sortField, sortDirection));
    
    // Add limit
    if (options.limitResults) {
      constraints.push(limitQuery(options.limitResults));
    }
    
    // Execute query
    const q = query(collection(db, "carListings"), ...constraints);
    const querySnapshot = await getDocs(q);
    
    // Parse results
    const listings: DocumentData[] = [];
    querySnapshot.forEach((doc) => {
      listings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return listings;
    
  } catch (error) {
    console.error("Error fetching car listings:", error);
    throw error;
  }
}

/**
 * Fetches car listings by owner
 * @param ownerId ID of the owner
 * @returns Array of car listings owned by the specified user
 */
export async function getCarListingsByOwner(ownerId: string) {
  try {
    // Simplified query that only filters by owner, without sorting on createdAt
    const q = query(
      collection(db, "carListings"),
      where("owner", "==", ownerId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Parse results
    const listings: DocumentData[] = [];
    
    querySnapshot.forEach((doc) => {
      listings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort the results client-side instead of in the query
    return listings.sort((a, b) => {
      // Sort by createdAt descending if available
      if (a.createdAt && b.createdAt) {
        return b.createdAt.seconds - a.createdAt.seconds;
      }
      return 0;
    });
    
  } catch (error) {
    console.error("Error fetching car listings by owner:", error);
    throw error;
  }
}

/**
 * Fetches currently available car listings
 * @param limit Maximum number of listings to return
 * @returns Array of active car listings
 */
export async function getAvailableCarListings(limit?: number) {
  try {
    // Create the most basic query possible to avoid index issues
    // Just get active listings without any date filtering
    const q = query(
      collection(db, "carListings"),
      where("status", "==", ListingStatus.ACTIVE),
      ...(limit ? [limitQuery(limit)] : [])
    );
    
    const querySnapshot = await getDocs(q);
    
    // Parse results
    const listings: DocumentData[] = [];
    
    querySnapshot.forEach((doc) => {
      listings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return listings;
    
  } catch (error) {
    console.error("Error fetching available car listings:", error);
    throw error;
  }
}
