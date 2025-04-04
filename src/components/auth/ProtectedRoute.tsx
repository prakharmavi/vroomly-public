import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/firebase/auth/AuthContext";
import { getUserProfile } from "@/firebase/db/services/userProfileService";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
}

export function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    async function checkUserProfile() {
      if (!user) {
        setCheckingProfile(false);
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);
        setProfileComplete(!!profile?.onboardingCompleted);
      } catch (error) {
        console.error("Error checking profile:", error);
      } finally {
        setCheckingProfile(false);
      }
    }

    if (!loading) {
      checkUserProfile();
    }
  }, [user, loading]);

  if (loading || checkingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login page but save the location they tried to access
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireOnboarding && !profileComplete) {
    // Redirect to onboarding if not completed
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
