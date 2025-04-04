import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { signUpWithEmail, signUpWithGoogle } from '@/firebase/auth/auth_signup';
import { useNavigate } from 'react-router-dom';
import { UserRound, Mail, LockKeyhole } from 'lucide-react';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await signUpWithEmail(email, password);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.user) {
      // Redirect to onboarding page with the user ID
      handleSuccessfulSignUp(result.user.uid);
    } else {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError('');
    
    const result = await signUpWithGoogle();
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.user) {
      // Redirect to onboarding page with the user ID
      handleSuccessfulSignUp(result.user.uid);
    } else {
      setLoading(false);
    }
  };

  // After successful sign up, redirect to onboarding for username selection
  const handleSuccessfulSignUp = async (uid: string) => {
    try {
      // Store uid in session storage to retrieve it during onboarding if needed
      if (uid) {
        sessionStorage.setItem('onboardingUserId', uid);
        // Also store a refresh flag to indicate that homepage should refresh after onboarding
        sessionStorage.setItem('refreshHomeAfterOnboarding', 'true');
      }
      
      // Redirect to onboarding after signup to set username and other details
      navigate('/onboarding');
    } catch (error) {
      console.error('Error after signup:', error);
      setError('An error occurred during signup. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              className="w-full pl-10 p-2 h-10 border rounded text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
          <div className="relative">
            <LockKeyhole size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full pl-10 p-2 h-10 border rounded text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="submit" className="w-full h-10" disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button 
        onClick={handleGoogleSignUp} 
        variant="outline" 
        className="w-full h-10 flex items-center gap-2" 
        disabled={loading}
      >
        <UserRound size={16} />
        <span>Sign Up with Google</span>
      </Button>
    </div>
  );
}
