import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { useAuth } from "@/firebase/auth/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { getUserProfile } from "@/firebase/db/services/userProfileService";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  
  useEffect(() => {
    async function checkProfile() {
      if (user) {
        const profile = await getUserProfile(user.uid);
        if (profile?.onboardingCompleted) {
          setHasProfile(true);
        }
      }
      setCheckingStatus(false);
    }
    
    checkProfile();
  }, [user]);
  
  // Redirect if not authenticated
  if (!user && !checkingStatus) {
    return <Navigate to="/auth" replace />;
  }
  
  // Redirect if already completed onboarding
  if (hasProfile && !checkingStatus) {
    return <Navigate to="/" replace />;
  }
  
  // Show loading while checking profile status
  if (checkingStatus) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const handleComplete = () => {
    // Check if we need to refresh the home page (set during sign up)
    const shouldRefresh = sessionStorage.getItem('refreshHomeAfterOnboarding') === 'true';
    
    // Clear the flag
    sessionStorage.removeItem('refreshHomeAfterOnboarding');
    
    // Navigate to home with refresh parameter if needed
    if (shouldRefresh) {
      navigate(`/?refresh=${Date.now()}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Complete Your Profile</h1>
        <p className="text-muted-foreground mt-2">
          Let's set up your profile to get the most out of car sharing
        </p>
      </div>
      
      <OnboardingForm onComplete={handleComplete} />
    </div>
  );
}
