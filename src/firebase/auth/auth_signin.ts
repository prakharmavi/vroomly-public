import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  AuthError, 
  UserCredential,
  User 
} from "firebase/auth";
import { auth } from "../firebase";

interface AuthResult {
  user: User | null;
  error: string | null;
}

interface SignOutResult {
  success: boolean;
  error: string | null;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    const authError = error as AuthError;
    return { user: null, error: authError.message };
  }
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const provider = new GoogleAuthProvider();
  // Removed contacts access request
  provider.setCustomParameters({ prompt: "select_account" });
  
  try {
    const result: UserCredential = await signInWithPopup(auth, provider);
    return { user: result.user, error: null };
  } catch (error) {
    const authError = error as AuthError;
    return { user: null, error: authError.message };
  }
}

export async function signOutUser(): Promise<SignOutResult> {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    const authError = error as AuthError;
    return { success: false, error: authError.message };
  }
}
