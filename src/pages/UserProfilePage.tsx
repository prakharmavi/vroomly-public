import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {  getUserProfileByUsername} from "@/firebase/db/services/userProfileService";
import { UserProfile } from "@/firebase/db/model/usermodel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StartConversationButton } from "@/components/messaging/StartConversationButton";
import { useAuth } from "@/firebase/auth/AuthContext";
import { User, BadgeCheck } from "lucide-react";

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const fetchedProfile = await getUserProfileByUsername(username||'');
        setProfile(fetchedProfile);
      } catch (err) {
        console.error("Error loading user profile:", err);
        setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        User profile not found
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{profile.displayName}</h1>
            
            {/* Add Message User button if viewing someone else's profile */}
            {user && profile && user.uid !== profile.uid && (
              <StartConversationButton 
                targetUserId={profile.uid}
                targetUsername={profile.username}
              />
            )}
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-24 w-24">
              {profile.profileImageUrl ? (
                <AvatarImage 
                  src={profile.profileImageUrl} 
                  alt={profile.displayName || "User avatar"}
                />
              ) : (
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="text-lg font-medium">{profile.displayName}</div>
              <div className="text-sm text-muted-foreground">{profile.username}</div>
              {profile.accountVerified && (
                <Badge className="mt-2 text-xs flex items-center gap-1 bg-green-500 text-white w-fit">
                  <BadgeCheck className="h-3 w-3" />
                  Verified Account
                </Badge>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Email</div>
              <div className="text-sm">{profile.email}</div>
            </div>
            {profile.phoneNumber && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Phone Number</div>
                <div className="text-sm">{profile.phoneNumber}</div>
              </div>
            )}
            {profile.bio && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Bio</div>
                <div className="text-sm">{profile.bio}</div>
              </div>
            )}
            {profile.occupation && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Occupation</div>
                <div className="text-sm">{profile.occupation}</div>
              </div>
            )}
            {profile.website && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Website</div>
                <div className="text-sm">
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary">
                    {profile.website}
                  </a>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}