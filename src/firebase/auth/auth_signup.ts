import { 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  AuthError, 
  UserCredential,
  User 
} from "firebase/auth";
import { auth } from "../firebase";

interface AuthResult {
  user: User | null;
  error: string | null;
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    const authError = error as AuthError;
    return { user: null, error: authError.message };
  }
}

export async function signUpWithGoogle(): Promise<AuthResult> {
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