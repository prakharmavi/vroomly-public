import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/firebase/firebase";

/**
 * Upload an image to Firebase Storage
 * @param file - The image file to upload
 * @param folder - Optional folder path (e.g., 'cars', 'profiles')
 * @returns Promise with the download URL of the uploaded image
 */
export async function uploadImage(file: File, folder: string = 'images'): Promise<string> {
  try {
    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${folder}/${filename}`;

    // Create a storage reference
    const storageRef = ref(storage, filePath);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading image to Firebase Storage:", error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Legacy function name for backward compatibility
 * @deprecated Use uploadImage instead
 */
export async function uploadToImgbb(file: File): Promise<string> {
  return uploadImage(file, 'cars');
}
