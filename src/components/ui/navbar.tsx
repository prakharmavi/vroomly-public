import React from "react";
import { ModeToggle } from "./mode-toggle";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  ChevronDown, 
  Settings, 
  HelpCircle,
  LogOut,
  Car,
  Calendar,
  Warehouse,
  Menu,
  UserCircle,
  Bell,
  BadgeCheck,
  MessageCircle
} from "lucide-react";
import { useAuth } from "@/firebase/auth/AuthContext";
import { useState, useEffect } from "react";
import { getUserProfile } from "@/firebase/db/services/userProfileService";
import { UserProfile } from "@/firebase/db/model/usermodel";
import { Badge } from "./badge";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { subscribeToUnreadCount } from "@/firebase/db/services/messagingService";
import { motion } from "framer-motion";

// Define navigation structure
interface NavItem {
  path: string;
  label: string;
  icon: React.ReactElement<any, any>;
  requiresAuth: boolean;
  location: 'main' | 'profile';
}

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Define all application navigation items
  const navigationItems: NavItem[] = [
    {
      path: "/cars",
      label: "Browse Cars",
      icon: <Car size={18} className="mr-1" />,
      requiresAuth: false,
      location: 'main'
    },
    {
      path: "/my-cars",
      label: "My Cars",
      icon: <Warehouse size={18} className="mr-1" />,
      requiresAuth: true,
      location: 'main'
    },
    {
      path: "/my-bookings", // Changed from "/bookings" to "/my-bookings"
      label: "Bookings",
      icon: <Calendar size={18} className="mr-1" />,
      requiresAuth: true,
      location: 'main'
    },
    {
      path: "/messages",
      label: "Messages",
      icon: <MessageCircle size={18} className="mr-1" />,
      requiresAuth: true,
      location: 'main'
    },
    {
      path: "/profile",
      label: "My Profile",
      icon: <User size={18} className="mr-2" />,
      requiresAuth: true,
      location: 'profile'
    },
    {
      path: "/settings",
      label: "Settings",
      icon: <Settings size={18} className="mr-2" />,
      requiresAuth: true,
      location: 'profile'
    }
  ];

  // Get main navigation items
  const mainNavItems = navigationItems.filter(item => 
    item.location === 'main' && (!item.requiresAuth || user)
  );

  // Get profile dropdown items
  const profileNavItems = navigationItems.filter(item => 
    item.location === 'profile' && (!item.requiresAuth || user)
  );

  // Fetch user profile when user is authenticated or changes
  useEffect(() => {
    async function fetchUserProfile() {
      if (user?.uid) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
          
          // Calculate profile completion if profile exists
          if (profile) {
            calculateProfileCompletion(profile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        // Reset profile when user signs out
        setUserProfile(null);
        setProfileCompletion(0);
      }
    }

    // Fetch profile data whenever user changes (sign in/out)
    fetchUserProfile();
    
  }, [user]); // This will run on initial mount and whenever user auth state changes

  // Subscribe to unread message count
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    
    if (user?.uid) {
      unsubscribe = subscribeToUnreadCount(user.uid, (count) => {
        setUnreadMessages(count);
      });
    } else {
      setUnreadMessages(0);
    }
    
    return () => unsubscribe();
  }, [user]);

  const calculateProfileCompletion = (profile: UserProfile) => {
    // Define fields to check
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
    setProfileCompletion(percentage);
  };

  const handleSignOut = async () => {
    await logout();
    navigate("/auth");
  };

  const profileIsIncomplete = userProfile && profileCompletion < 70 && !userProfile.onboardingCompleted;
  
  // Helper function to render notification indicator for messages
  const renderMessageIndicator = () => {
    if (unreadMessages > 0) {
      return (
        <motion.span 
          className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 10 }}
          whileHover={{ scale: 1.2 }}
        >
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-50 animate-pulse"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] font-bold items-center justify-center">
            {unreadMessages > 9 ? '9+' : unreadMessages}
          </span>
        </motion.span>
      );
    }
    return null;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-16 items-center px-4 sm:px-6 mx-auto max-w-7xl justify-between">
        <div className="flex flex-1 items-center">
          <Link to="/" className="font-bold text-xl mr-6">Vroomly</Link>
          
          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden ml-auto" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={24} />
          </Button>
          
          {/* Desktop navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {mainNavItems.map((item) => (
                <NavigationMenuItem key={item.path}>
                  <Link to={item.path} className={navigationMenuTriggerStyle()}>
                    <div className="flex items-center relative">
                      {item.icon}
                      {item.label}
                      {item.path === "/messages" && renderMessageIndicator()}
                    </div>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <ModeToggle />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 px-3 h-10 relative">
                  <Avatar className="h-7 w-7">
                    {userProfile?.profileImageUrl ? (
                      <AvatarImage 
                        src={userProfile.profileImageUrl} 
                        alt={userProfile.displayName || "User avatar"}
                      />
                    ) : (
                      <AvatarFallback>
                        <UserCircle className="h-5 w-5" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="max-w-[120px] truncate hidden sm:inline">
                    {userProfile?.displayName || userProfile?.username || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown size={16} className="text-muted-foreground ml-0 sm:ml-1" />
                  
                  {/* Profile completion indicator */}
                  {profileIsIncomplete && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-1">
                  <span>My Account</span>
                  {profileIsIncomplete && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1 w-fit">
                      <Bell className="h-3 w-3" />
                      Complete your profile ({profileCompletion}%)
                    </Badge>
                  )}
                  {userProfile?.accountVerified && (
                    <Badge className="text-xs flex items-center gap-1 bg-green-500 text-white w-fit">
                      <BadgeCheck className="h-3 w-3" />
                      Verified Account
                    </Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Profile menu items */}
                {profileNavItems.map((item) => (
                  <DropdownMenuItem key={item.path} onClick={() => navigate(item.path)}>
                    {item.icon}
                    <span>{item.label}</span>
                    {item.path === "/messages" && unreadMessages > 0 && (
                      <Badge variant="destructive" className="ml-auto text-xs">
                        {unreadMessages}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
                
                {/* Public profile link if username exists */}
                {userProfile?.username && (
                  <DropdownMenuItem onClick={() => navigate(`/user/${userProfile.username}`)}>
                    <UserCircle size={18} className="mr-2" />
                    <span>Public Profile</span>
                  </DropdownMenuItem>
                )}
                
                {/* Add My Bookings menu item */}
                <DropdownMenuItem asChild>
                  <Link to="/my-bookings" className="flex items-center gap-2 cursor-pointer">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>My Bookings</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <HelpCircle size={18} className="mr-2" />
                  <span>Help</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut size={18} className="mr-2" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          )}
        </div>
      </div>
      
      {/* Mobile menu - using the same navigation items for consistency */}
      {mobileMenuOpen && (
        <div className="md:hidden py-4 px-4 border-t bg-background">
          <nav className="flex flex-col space-y-3">
            {/* Main navigation items */}
            {mainNavItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path}
                className="flex items-center px-4 py-2 rounded-md hover:bg-accent justify-between"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  {React.cloneElement(item.icon, { size: 20, className: "mr-2" } as React.HTMLAttributes<SVGElement> & { size: number })}
                  {item.label}
                </div>
                {item.path === "/messages" && unreadMessages > 0 && (
                  <Badge variant="destructive">{unreadMessages}</Badge>
                )}
              </Link>
            ))}
            
            {/* Profile navigation items */}
            {user && (
              <>
                <div className="h-px bg-muted my-2"></div>
                {profileNavItems.map((item) => (
                  <Link 
                    key={item.path}
                    to={item.path}
                    className="flex items-center px-4 py-2 rounded-md hover:bg-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {React.cloneElement(item.icon, { size: 20, className: "mr-2" } as React.HTMLAttributes<SVGElement> & { size: number })}
                    {item.label} 
                    {item.path === "/profile" && profileIsIncomplete && 
                      <span className="ml-2 text-xs text-yellow-500">• Incomplete</span>
                    }
                  </Link>
                ))}
                
                {/* Public profile link if username exists */}
                {userProfile?.username && (
                  <Link 
                    to={`/user/${userProfile.username}`}
                    className="flex items-center px-4 py-2 rounded-md hover:bg-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserCircle size={20} className="mr-2" />
                    Public Profile
                  </Link>
                )}
                
                <Button 
                  variant="ghost" 
                  className="flex items-center justify-start px-4 py-2 rounded-md hover:bg-accent w-full text-destructive"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut size={20} className="mr-2" />
                  Sign out
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

