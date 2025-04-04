import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../firebase';
import { signOutUser } from './auth_signin';
import { hasCompletedOnboarding } from "../db/services/userProfileService";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  onboardingCompleted: boolean;
  checkOnboardingStatus: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  onboardingCompleted: false,
  checkOnboardingStatus: async () => {},
  logout: async () => {} 
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOutUser();
  };

  const checkOnboardingStatus = async () => {
    if (user) {
      const completed = await hasCompletedOnboarding(user.uid);
      setOnboardingCompleted(completed);
    } else {
      setOnboardingCompleted(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      onboardingCompleted,
      checkOnboardingStatus,
      logout 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
