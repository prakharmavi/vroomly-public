import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import db from "../firestore";
import { UserProfile } from "../model/usermodel";

/**
 * Fetches a user profile by username
 * @param username The username to look up
 * @returns The user profile or null if not found
 */
export async function getUserProfileByUsername(username: string): Promise<UserProfile | null> {
  try {
    // Query users collection where username equals the provided username
    const q = query(collection(db, "users"), where("username", "==", username));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Get the first document (username should be unique)
    const userDoc = querySnapshot.docs[0];
    return {
      ...userDoc.data(),
      uid: userDoc.id
    } as UserProfile;
  } catch (error) {
    console.error("Error fetching user profile by username:", error);
    throw error;
  }
}

/**
 * Fetches a user profile by user ID
 * @param uid The user ID to look up
 * @returns The user profile or null if not found
 */
export async function getUserProfileById(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        ...docSnap.data(),
        uid: docSnap.id
      } as UserProfile;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile by ID:", error);
    throw error;
  }
}
