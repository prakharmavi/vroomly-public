import { doc, getDoc,  serverTimestamp, runTransaction } from "firebase/firestore";
import db from "../firestore";
import { User } from "firebase/auth";
import { UserProfile } from "../model/usermodel";

import { IMGBB_API_KEY } from "@/config/api-keys";

interface UserProfileResult {
  success: boolean;
  error?: string;
}

/**
 * Upload an image to ImgBB
 * @param file The image file to upload
 * @returns Promise with the image URL or null if failed
 */
async function uploadImageToImgBB(file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', IMGBB_API_KEY);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return data.data.url;
    } else {
      console.error("Failed to upload image to ImgBB:", data);
      throw new Error(`ImgBB upload failed: ${data.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error("Error uploading image to ImgBB:", error);
    throw error; // Rethrow to handle in the component
  }
}

/**
 * Creates or updates a user profile in Firestore
 */
export async function saveUserProfile(
  profileData: Partial<UserProfile>,
  user: User,
  photoFile?: File | null
): Promise<UserProfileResult> {
  try {
    if (!user || !user.uid) {
      return {
        success: false,
        error: "User must be authenticated to save profile"
      };
    }

    // Check if username was provided and handle username uniqueness
    if (profileData.username) {
      const username = profileData.username.toLowerCase();
      
      // Verify username is available
      const userRef = doc(db, "userProfiles", user.uid);
      const userSnapshot = await getDoc(userRef);
      const currentProfile = userSnapshot.exists() ? userSnapshot.data() as UserProfile : null;
      
      // Only check availability if this is a new username or username changed
      if (!currentProfile?.username || currentProfile.username.toLowerCase() !== username) {
        const isAvailable = await isUsernameAvailable(username);
        if (!isAvailable) {
          return {
            success: false,
            error: "Username is already taken. Please choose another one."
          };
        }
      }

      let profileImageUrl = currentProfile?.profileImageUrl || "";
      let userProvidedPhoto = currentProfile?.userProvidedPhoto || false;

      // Handle photo upload if provided
      if (photoFile) {
        try {
          // Upload to ImgBB instead of Firebase Storage
          const imgUrl = await uploadImageToImgBB(photoFile);
          
          if (imgUrl) {
            profileImageUrl = imgUrl;
            userProvidedPhoto = true;
          } else {
            return {
              success: false,
              error: "Failed to upload profile image. Please try again."
            };
          }
        } catch (error) {
          console.error("Error uploading profile image:", error);
          return {
            success: false,
            error: "Failed to upload profile image. Please try again."
          };
        }
      }

      // Get avatar URL from UI Avatars if no profile image
      const displayName = profileData.displayName || currentProfile?.displayName || user.displayName || "";
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

      // Prepare data to save
      const dataToSave = {
        ...profileData,
        username
      };

      // Save to Firestore
      await runTransaction(db, async (transaction) => {
        // Save username to usernames collection
        const usernameRef = doc(db, "usernames", username);
        transaction.set(usernameRef, { uid: user.uid });
        
        // Remove previous username if it's different
        if (currentProfile?.username && currentProfile.username.toLowerCase() !== username) {
          const oldUsernameRef = doc(db, "usernames", currentProfile.username.toLowerCase());
          transaction.delete(oldUsernameRef);
        }
        
        // Prepare profile data
        const profileToSave: Partial<UserProfile> = {
          ...dataToSave,
          uid: user.uid,
          updatedAt: serverTimestamp(),
          avatar: avatar,
          profileImageUrl: profileImageUrl || avatar,
          userProvidedPhoto
        };
        
        // Add createdAt field only for new profiles
        if (!currentProfile) {
          profileToSave.createdAt = serverTimestamp();
        }
        
        // Save profile data
        const userProfileRef = doc(db, "userProfiles", user.uid);
        transaction.set(userProfileRef, profileToSave, { merge: true });
      });

      return { success: true };
    } else {
      return {
        success: false,
        error: "Username is required"
      };
    }
  } catch (error) {
    console.error("Error saving user profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
}

/**
 * Gets a user profile from Firestore
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, "userProfiles", userId);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
      return userSnapshot.data() as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

/**
 * Checks if a user has completed onboarding
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  try {
    const profile = await getUserProfile(userId);
    return !!profile?.onboardingCompleted;
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return false;
  }
}

/**
 * Retrieves a user profile by username
 */
export async function getUserProfileByUsername(username: string): Promise<UserProfile | null> {
  try {
    // First, lookup the UID from the usernames collection
    const usernameRef = doc(db, "usernames", username.toLowerCase());
    const usernameDoc = await getDoc(usernameRef);
    
    if (!usernameDoc.exists()) {
      return null;
    }
    
    const { uid } = usernameDoc.data();
    
    // With the UID, fetch the user profile
    const userRef = doc(db, "userProfiles", uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return userDoc.data() as UserProfile;
  } catch (error) {
    console.error("Error getting user profile by username:", error);
    return null;
  }
}

/**
 * Checks if a username is already taken
 * @param username The username to check
 * @returns boolean indicating if the username is available (not taken)
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const usernameRef = doc(db, "usernames", username.toLowerCase());
    const usernameDoc = await getDoc(usernameRef);
    return !usernameDoc.exists();
  } catch (error) {
    console.error("Error checking username availability:", error);
    throw error;
  }
}
