export interface UserProfile {
  uid: string;
  username: string; 
  displayName: string;
  email: string;
  phoneNumber: string;
  avatar: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  driverLicense: string;
  dateOfBirth: Date | null;
  profileImageUrl: string;
  bio: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  onboardingCompleted: boolean;
  userProvidedPhoto: boolean; // Track if user provided their own photo
  // New fields
  occupation?: string;
  website?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  preferredContactMethod?: string;
  accountVerified?: boolean;
  drivingExperience?: number; // in years
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  userPreferences?: {
    notifications: boolean;
    darkMode: boolean;
    language: string;
  };
}

export interface UserProfileFormData {
  displayName: string;
  profilePhoto?: string | null;
  email: string;
  username: string;
  phoneNumber?: string;
  driverLicense?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  dateOfBirth?: string;
  bio?: string;
  onboardingCompleted: boolean;
  photoFile?: File | null; // Add photo file for upload
  // New fields
  occupation?: string;
  website?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  preferredContactMethod?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  notificationsEnabled?: boolean;
  darkModeEnabled?: boolean;
  preferredLanguage?: string;
}

export const initialUserProfileFormData: UserProfileFormData = {
  displayName: "",
  email: "",
  username: "",
  phoneNumber: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  dateOfBirth: "",
  bio: "",
  onboardingCompleted: false,
  photoFile: null,
  // New initialized fields
  occupation: "",
  website: "",
  socialLinks: {
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: ""
  },
  preferredContactMethod: "email",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactPhone: "",
  notificationsEnabled: true,
  darkModeEnabled: false,
  preferredLanguage: "en",
};
