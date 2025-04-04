import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { signInWithEmail, signInWithGoogle } from '@/firebase/auth/auth_signin';
import { useNavigate } from 'react-router-dom';
import { UserRound, Mail, LockKeyhole } from 'lucide-react';
import { getUserProfile } from '@/firebase/db/services/userProfileService';

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await signInWithEmail(email, password);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.user) {
      // Successfully signed in, now check if user has a profile
      await handleSuccessfulAuth(result.user.uid);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    const result = await signInWithGoogle();
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.user) {
      // Successfully signed in with Google, check if user has a profile
      await handleSuccessfulAuth(result.user.uid);
    }
  };
  
  // Handle successful authentication and check profile status
  const handleSuccessfulAuth = async (userId: string) => {
    try {
      // Check if the user has a profile
      const userProfile = await getUserProfile(userId);
      
      if (!userProfile || !userProfile.onboardingCompleted || !userProfile.username) {
        // No profile, incomplete profile, or no username set - redirect to onboarding
        navigate('/onboarding');
      } else {
        // Existing user with complete profile, go to home
        // Add a timestamp parameter to force a refresh of the homepage
        navigate('/?refresh=' + Date.now());
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
      navigate('/'); // Default to home on error
    } finally {
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
          {loading ? 'Signing in...' : 'Sign In'}
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
        onClick={handleGoogleSignIn} 
        variant="outline" 
        className="w-full h-10 flex items-center gap-2" 
        disabled={loading}
      >
        <UserRound size={16} />
        <span>Sign In with Google</span>
      </Button>
    </div>
  );
}
