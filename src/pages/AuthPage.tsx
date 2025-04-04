import { useState } from "react";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/firebase/auth/AuthContext";
import { Navigate } from "react-router-dom";

export function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const { user } = useAuth();
  
  // Redirect if user is already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
          {mode === "signin" ? "Sign In" : "Create Account"}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {mode === "signin" 
            ? "Enter your credentials to access your account" 
            : "Fill out the form to create your account"}
        </p>
      </div>
      
      {mode === "signin" ? <SignInForm /> : <SignUpForm />}
      
      <div className="text-center">
        <Button 
          variant="link" 
          className="text-sm sm:text-base"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" 
            ? "Don't have an account? Sign up" 
            : "Already have an account? Sign in"}
        </Button>
      </div>
    </div>
  );
}
