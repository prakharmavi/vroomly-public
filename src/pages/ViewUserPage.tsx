import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getUserProfileByUsername } from "@/firebase/db/services/userProfileService";
import { UserProfile } from "@/firebase/db/model/usermodel";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/firebase/auth/AuthContext";

export function ViewUserPage() {
  const { username } = useParams<{ username: string }>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    async function fetchUserProfile() {
      if (!username) {
        setError("Username is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const profile = await getUserProfileByUsername(username);
        
        if (profile) {
          setUserProfile(profile);
        } else {
          setError(`User '${username}' not found`);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Failed to load user profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [username, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-8 w-full max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">User Profile</h1>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 w-full max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">User Profile: {username}</h1>
      
      {userProfile ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-card rounded-lg border p-4">
              <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
              <div className="space-y-2">
                <p className="flex justify-between">
                  <span className="font-medium">Display Name:</span> 
                  <span>{userProfile.displayName || "Not provided"}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium">Username:</span> 
                  <span>{userProfile.username}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium">Email:</span> 
                  <span>{userProfile.email || "Not provided"}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium">Location:</span> 
                  <span>
                    {[userProfile.city, userProfile.state]
                      .filter(Boolean)
                      .join(", ") || "Not provided"}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium">Member Since:</span> 
                  <span>
                    {userProfile.createdAt ? 
                      new Date(userProfile.createdAt.toDate()).toLocaleDateString() : 
                      "Unknown"}
                  </span>
                </p>
              </div>
            </div>
            
            {userProfile.bio && (
              <div className="bg-card rounded-lg border p-4">
                <h2 className="text-xl font-semibold mb-2">About</h2>
                <p className="text-sm text-muted-foreground">{userProfile.bio}</p>
              </div>
            )}
          </div>
          
          <div className="bg-card rounded-lg border p-4">
            <h2 className="text-xl font-semibold mb-4">Raw Profile Data</h2>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
              {JSON.stringify(userProfile, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-yellow-700 dark:text-yellow-300">
          No profile information found for this user.
        </div>
      )}
    </div>
  );
}