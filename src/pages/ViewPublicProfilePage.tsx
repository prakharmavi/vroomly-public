import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getUserProfileByUsername } from "@/firebase/db/services/userProfileService";
import { UserProfile } from "@/firebase/db/model/usermodel";
import { Loader2, User, Calendar, MapPin, Shield, Mail, Phone, Link as  Briefcase, Globe, Share2, Star, Car } from "lucide-react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ViewPublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

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
  }, [username]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">User Profile</h1>
      
      {userProfile ? (
        <>
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
              <TabsTrigger value="cars" className="flex-1">Car Listings</TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1">Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card className="overflow-hidden mb-6">
                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                <div className="px-4 sm:px-6 -mt-16">
                  <Avatar className="h-24 w-24 border-4 border-background bg-background">
                    {userProfile.profileImageUrl ? (
                      <AvatarImage src={userProfile.profileImageUrl} alt={userProfile.displayName} />
                    ) : (
                      <AvatarFallback>
                        <User className="h-12 w-12 text-muted-foreground" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
                
                <CardContent className="p-4 sm:p-6 pt-2">
                  <div className="mb-6">
                    <div className="flex items-center">
                      <h2 className="text-2xl font-bold">{userProfile.displayName}</h2>
                      {userProfile.accountVerified && (
                        <Badge className="ml-2 bg-green-500" variant="secondary">
                          <Shield className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">@{userProfile.username}</p>
                    {userProfile.occupation && (
                      <p className="text-sm flex items-center mt-1">
                        <Briefcase className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        <span className="text-muted-foreground">{userProfile.occupation}</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {userProfile.bio && (
                      <div>
                        <h3 className="font-medium text-sm mb-1">About</h3>
                        <p className="text-sm text-muted-foreground">{userProfile.bio}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Member since {userProfile.createdAt ? 
                            new Date(userProfile.createdAt.toDate()).toLocaleDateString() : 
                            "Unknown"}
                        </span>
                      </div>
                      
                      {(userProfile.city || userProfile.state) && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {[userProfile.city, userProfile.state]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Contact Information - shown selectively */}
                    <div className="pt-2 border-t">
                      <h3 className="font-medium text-sm mb-2">Contact Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{userProfile.email}</span>
                        </div>
                        
                        {userProfile.phoneNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{userProfile.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Social Media Links */}
                    {userProfile.socialLinks && Object.values(userProfile.socialLinks).some(link => link) && (
                      <div className="pt-2 border-t">
                        <h3 className="font-medium text-sm mb-2 flex items-center">
                          <Share2 className="h-4 w-4 mr-1" />
                          Connect
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {userProfile.socialLinks.facebook && (
                            <a 
                              href={userProfile.socialLinks.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-muted rounded-full text-xs hover:bg-muted/80"
                            >
                              Facebook
                            </a>
                          )}
                          {userProfile.socialLinks.twitter && (
                            <a 
                              href={userProfile.socialLinks.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-muted rounded-full text-xs hover:bg-muted/80"
                            >
                              Twitter
                            </a>
                          )}
                          {userProfile.socialLinks.instagram && (
                            <a 
                              href={userProfile.socialLinks.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-muted rounded-full text-xs hover:bg-muted/80"
                            >
                              Instagram
                            </a>
                          )}
                          {userProfile.socialLinks.linkedin && (
                            <a 
                              href={userProfile.socialLinks.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-muted rounded-full text-xs hover:bg-muted/80"
                            >
                              LinkedIn
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {userProfile.website && (
                      <div className="flex items-center gap-2 text-sm pt-2 border-t">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={userProfile.website.startsWith('http') ? userProfile.website : `https://${userProfile.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                        >
                          {userProfile.website}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="p-4 sm:p-6 pt-0 border-t mt-4">
                  <Link to={`/cars?owner=${userProfile.uid}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      View {userProfile.displayName}'s Car Listings
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
              
              {/* User Stats Card */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">User Activity</h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-primary">0</p>
                      <p className="text-xs text-muted-foreground">Car Listings</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-primary">0</p>
                      <p className="text-xs text-muted-foreground">Reviews</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-primary">0</p>
                      <p className="text-xs text-muted-foreground">Bookings</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center">
                        <p className="text-2xl font-bold text-primary">0.0</p>
                        <Star className="h-4 w-4 text-yellow-500 ml-1" />
                      </div>
                      <p className="text-xs text-muted-foreground">Rating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="cars">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">{userProfile.displayName}'s Car Listings</h3>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-8 text-muted-foreground">
                    <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No car listings found for this user.</p>
                    <p className="text-sm mt-2">Check back later or browse other listings.</p>
                  </div>
                </CardContent>
                <CardFooter className="border-t">
                  <Link to="/cars" className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      Browse All Car Listings
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Reviews for {userProfile.displayName}</h3>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-8 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reviews yet.</p>
                    <p className="text-sm mt-2">This user hasn't received any reviews.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-yellow-700 dark:text-yellow-300">
          No profile information found for this user.
        </div>
      )}
    </div>
  );
}
