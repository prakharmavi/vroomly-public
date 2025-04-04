import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/firebase/auth/AuthContext";
import { getUserProfile } from "@/firebase/db/services/userProfileService";
import { UserProfile } from "@/firebase/db/model/usermodel";
import { Loader2, PenSquare, ChevronLeft,  MapPin, Shield, Phone, Mail, Briefcase,  FileCheck, AlertCircle, Globe, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    async function fetchUserProfile() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
        
        // Calculate profile completion percentage
        if (profile) {
          calculateCompletionPercentage(profile);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Failed to load profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [user]);
  
  const calculateCompletionPercentage = (profile: UserProfile) => {
    // Define required and optional fields
    const requiredFields = ['displayName', 'username', 'email'];
    const optionalFields = [
      'phoneNumber', 'address', 'city', 'state', 'zipCode', 
      'driverLicense', 'dateOfBirth', 'bio', 'profileImageUrl',
      'occupation', 'website'
    ];
    
    // Count completed required fields
    const completedRequired = requiredFields.filter(
      field => profile[field as keyof UserProfile]
    ).length;
    
    // Count completed optional fields
    const completedOptional = optionalFields.filter(
      field => {
        const value = profile[field as keyof UserProfile];
        return value !== undefined && value !== null && value !== '';
      }
    ).length;
    
    // Check for completed nested objects
    let additionalPoints = 0;
    
    // Social links
    if (profile.socialLinks) {
      const socialLinkEntries = Object.entries(profile.socialLinks).filter(([ value]) => value);
      additionalPoints += Math.min(socialLinkEntries.length, 2);
    }
    
    // Emergency contact
    if (profile.emergencyContact?.name && profile.emergencyContact?.phoneNumber) {
      additionalPoints += 2;
    }
    
    // Calculate percentage
    const totalPossiblePoints = requiredFields.length + optionalFields.length + 4; // +4 for social & emergency
    const totalCompletedPoints = completedRequired + completedOptional + additionalPoints;
    
    const percentage = Math.round((totalCompletedPoints / totalPossiblePoints) * 100);
    setCompletionPercentage(percentage);
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    // Reload profile data after edit
    if (user?.uid) {
      setLoading(true);
      getUserProfile(user.uid)
        .then(profile => {
          setUserProfile(profile);
          if (profile) {
            calculateCompletionPercentage(profile);
          }
        })
        .catch(err => {
          console.error("Error refreshing profile:", err);
          setError("Updated profile but failed to refresh. Please reload the page.");
        })
        .finally(() => setLoading(false));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-yellow-700 dark:text-yellow-300">
          You must be logged in to view your profile.
        </div>
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

  if (isEditing) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setIsEditing(false)}
            className="shrink-0"
          >
            <ChevronLeft size={18} />
          </Button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Edit Profile</h1>
        </div>
        
        {userProfile && <EditProfileForm 
          initialData={userProfile} 
          onSuccess={handleEditSuccess} 
          onCancel={() => setIsEditing(false)}
        />}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      
      {userProfile ? (
        <div className="space-y-6">
          {/* Profile completion card */}
          {!userProfile.onboardingCompleted && (
            <Card className="border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-grow space-y-2">
                    <h3 className="font-semibold flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                      Complete Your Profile
                    </h3>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Profile Completion</span>
                        <span>{completionPercentage}%</span>
                      </div>
                      <Progress value={completionPercentage} className="h-2" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Complete your profile to unlock all Vroomly features.
                    </p>
                  </div>
                  <Button onClick={() => setIsEditing(true)}>
                    Complete Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Main profile content */}
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="preferences" className="flex-1">Preferences</TabsTrigger>
              <TabsTrigger value="security" className="flex-1">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <Card>
                <CardHeader className="p-4 sm:p-6 pb-0">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Avatar className="h-20 w-20">
                      {userProfile.profileImageUrl ? (
                        <AvatarImage src={userProfile.profileImageUrl} alt={userProfile.displayName} />
                      ) : (
                        <AvatarFallback>{userProfile.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="text-center sm:text-left">
                      <h2 className="text-xl font-bold">{userProfile.displayName}</h2>
                      <p className="text-muted-foreground">@{userProfile.username}</p>
                      {userProfile.occupation && (
                        <p className="text-sm flex items-center mt-1">
                          <Briefcase className="h-3.5 w-3.5 mr-1" />
                          {userProfile.occupation}
                        </p>
                      )}
                    </div>
                    <Button 
                      className="ml-auto" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <PenSquare className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm">Contact Information</h3>
                      <p className="text-sm flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">{userProfile.email}</span>
                      </p>
                      {userProfile.phoneNumber && (
                        <p className="text-sm flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-muted-foreground">{userProfile.phoneNumber}</span>
                        </p>
                      )}
                      {userProfile.website && (
                        <p className="text-sm flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                          <a 
                            href={userProfile.website.startsWith('http') ? userProfile.website : `https://${userProfile.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary truncate max-w-[220px]"
                          >
                            {userProfile.website}
                          </a>
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm">Location</h3>
                      {(userProfile.city || userProfile.state) && (
                        <p className="text-sm flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {[userProfile.city, userProfile.state].filter(Boolean).join(", ")}
                          </span>
                        </p>
                      )}
                      {userProfile.address && (
                        <p className="text-sm flex items-center">
                          <span className="h-4 w-4 mr-2" />
                          <span className="text-muted-foreground">{userProfile.address}</span>
                        </p>
                      )}
                      {userProfile.zipCode && (
                        <p className="text-sm flex items-center">
                          <span className="h-4 w-4 mr-2" />
                          <span className="text-muted-foreground">{userProfile.zipCode}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {userProfile.bio && (
                    <div className="mt-4">
                      <h3 className="font-medium text-sm mb-2">About Me</h3>
                      <p className="text-sm text-muted-foreground">{userProfile.bio}</p>
                    </div>
                  )}
                  
                  {/* Social Media Links */}
                  {userProfile.socialLinks && Object.values(userProfile.socialLinks).some(link => link) && (
                    <div className="mt-4">
                      <h3 className="font-medium text-sm mb-2 flex items-center">
                        <Share2 className="h-4 w-4 mr-1" />
                        Social Media
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
                  
                  <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-2">
                    <p className="text-xs">
                      <span className="font-medium">Member Since:</span>{" "}
                      <span className="text-muted-foreground">
                        {userProfile.createdAt ? new Date(userProfile.createdAt.toDate()).toLocaleDateString() : "Unknown"}
                      </span>
                    </p>
                    <p className="text-xs">
                      <span className="font-medium">Last Updated:</span>{" "}
                      <span className="text-muted-foreground">
                        {userProfile.updatedAt ? new Date(userProfile.updatedAt.toDate()).toLocaleDateString() : "Unknown"}
                      </span>
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="p-4 sm:p-6 pt-0 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate("/my-cars")}>My Car Listings</Button>
                  <Button variant="outline" size="sm" onClick={() => navigate("/my-bookings")}>My Bookings</Button>
                  {!userProfile.onboardingCompleted && (
                    <Button className="ml-auto" size="sm" onClick={() => navigate("/onboarding")}>
                      Complete Onboarding
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="font-medium">Date of Birth</span>
                      <span className="text-muted-foreground">
                        {userProfile.dateOfBirth ? new Date(userProfile.dateOfBirth as any).toLocaleDateString() : "Not provided"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="font-medium">Occupation</span>
                      <span className="text-muted-foreground">{userProfile.occupation || "Not provided"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Preferred Contact</span>
                      <span className="text-muted-foreground capitalize">{userProfile.preferredContactMethod || "Not set"}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <h3 className="text-lg font-semibold">Driver Information</h3>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="font-medium">Driver's License</span>
                      <span className="text-muted-foreground">
                        {userProfile.driverLicense ? 
                          <span className="flex items-center">
                            <Shield className="h-4 w-4 mr-1 text-green-500" />
                            Provided
                          </span> 
                          : "Not provided"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="font-medium">Account Verified</span>
                      <span className="text-muted-foreground">
                        {userProfile.accountVerified ? 
                          <span className="flex items-center text-green-500">
                            <FileCheck className="h-4 w-4 mr-1" />
                            Verified
                          </span> 
                          : "Not verified"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Experience</span>
                      <span className="text-muted-foreground">
                        {userProfile.drivingExperience ? 
                          `${userProfile.drivingExperience} years` : 
                          "Not specified"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <h3 className="text-lg font-semibold">Emergency Contact</h3>
                  </CardHeader>
                  <CardContent>
                    {userProfile.emergencyContact?.name ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm border-b pb-2">
                          <span className="font-medium">Name</span>
                          <span className="text-muted-foreground">{userProfile.emergencyContact.name}</span>
                        </div>
                        <div className="flex justify-between text-sm border-b pb-2">
                          <span className="font-medium">Relationship</span>
                          <span className="text-muted-foreground">{userProfile.emergencyContact.relationship || "Not specified"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Phone</span>
                          <span className="text-muted-foreground">{userProfile.emergencyContact.phoneNumber}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No emergency contact information provided.</p>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <h3 className="text-lg font-semibold">Account Details</h3>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="font-medium">User ID</span>
                      <span className="text-muted-foreground truncate max-w-[200px]">{userProfile.uid}</span>
                    </div>
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="font-medium">Username</span>
                      <span className="text-muted-foreground">@{userProfile.username}</span>
                    </div>
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="font-medium">Created</span>
                      <span className="text-muted-foreground">
                        {userProfile.createdAt ? new Date(userProfile.createdAt.toDate()).toLocaleString() : "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Last Updated</span>
                      <span className="text-muted-foreground">
                        {userProfile.updatedAt ? new Date(userProfile.updatedAt.toDate()).toLocaleString() : "Unknown"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Your Preferences</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">Notifications</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          {userProfile.userPreferences?.notifications ? "Enabled" : "Disabled"}
                        </span>
                        <Badge variant={userProfile.userPreferences?.notifications ? "default" : "outline"}>
                          {userProfile.userPreferences?.notifications ? "On" : "Off"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">Dark Mode</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          {userProfile.userPreferences?.darkMode ? "Enabled" : "Disabled"}
                        </span>
                        <Badge variant={userProfile.userPreferences?.darkMode ? "default" : "outline"}>
                          {userProfile.userPreferences?.darkMode ? "On" : "Off"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">Language</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Preferred Language</span>
                        <Badge>
                          {userProfile.userPreferences?.language === 'en' ? 'English' : 
                           userProfile.userPreferences?.language === 'es' ? 'Spanish' : 
                           userProfile.userPreferences?.language === 'fr' ? 'French' : 
                           userProfile.userPreferences?.language === 'de' ? 'German' : 
                           userProfile.userPreferences?.language === 'zh' ? 'Chinese' : 'English'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">Contact Method</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Preferred Method</span>
                        <Badge variant="outline" className="capitalize">
                          {userProfile.preferredContactMethod || "Email"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      Edit Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Security & Identity</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">Account Status</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Account verification</span>
                        <Badge variant={userProfile.accountVerified ? "default" : "outline"}>
                          {userProfile.accountVerified ? "Verified" : "Unverified"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">Driver's License</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">License verification</span>
                        <Badge variant={userProfile.driverLicense ? "default" : "outline"}>
                          {userProfile.driverLicense ? "Provided" : "Not Provided"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">Profile Photo</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Custom photo</span>
                        <Badge variant={userProfile.userProvidedPhoto ? "default" : "outline"}>
                          {userProfile.userProvidedPhoto ? "Uploaded" : "Default"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">Onboarding</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Profile setup</span>
                        <Badge variant={userProfile.onboardingCompleted ? "default" : "outline"}>
                          {userProfile.onboardingCompleted ? "Completed" : "Incomplete"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      Update Security Info
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-yellow-700 dark:text-yellow-300">
          No profile information found. Please complete your profile setup.
        </div>
      )}
    </div>
  );
}
