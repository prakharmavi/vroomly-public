import { useAuth } from "@/firebase/auth/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface RequireAuthProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export function RequireAuth({ 
  children, 
  requireOnboarding = true 
}: RequireAuthProps) {
  const { user, loading, onboardingCompleted, checkOnboardingStatus } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  
  useEffect(() => {
    async function check() {
      if (!loading && user) {
        await checkOnboardingStatus();
      }
      setChecking(false);
    }
    
    check();
  }, [user, loading, checkOnboardingStatus]);
  
  if (loading || checking) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    // Redirect to login page but save the location they tried to access
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  if (requireOnboarding && !onboardingCompleted) {
    // Redirect to onboarding if not completed
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
}
