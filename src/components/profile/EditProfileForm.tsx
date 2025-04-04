import { useState, ChangeEvent, useRef } from "react";
import { useAuth } from "@/firebase/auth/AuthContext";
import { saveUserProfile } from "@/firebase/db/services/userProfileService";
import { UserProfile } from "@/firebase/db/model/usermodel";
import { Button } from "@/components/ui/button";
import { Loader2, Info, Camera, Upload } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface EditProfileFormProps {
  initialData: UserProfile;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditProfileForm({ initialData, onSuccess, onCancel }: EditProfileFormProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    displayName: initialData.displayName || "",
    username: initialData.username || "",
    email: initialData.email || "",
    phoneNumber: initialData.phoneNumber || "",
    address: initialData.address || "",
    city: initialData.city || "",
    state: initialData.state || "",
    zipCode: initialData.zipCode || "",
    dateOfBirth: initialData.dateOfBirth ? new Date(initialData.dateOfBirth as any).toISOString().split('T')[0] : "",
    bio: initialData.bio || "",
    photoFile: null as File | null,
    driverLicense: initialData.driverLicense || "",
    occupation: initialData.occupation || "",
    website: initialData.website || "",
    socialLinks: {
      facebook: initialData.socialLinks?.facebook || "",
      twitter: initialData.socialLinks?.twitter || "",
      instagram: initialData.socialLinks?.instagram || "",
      linkedin: initialData.socialLinks?.linkedin || ""
    },
    preferredContactMethod: initialData.preferredContactMethod || "email",
    emergencyContactName: initialData.emergencyContact?.name || "",
    emergencyContactRelationship: initialData.emergencyContact?.relationship || "",
    emergencyContactPhone: initialData.emergencyContact?.phoneNumber || "",
    notificationsEnabled: initialData.userPreferences?.notifications !== undefined ? 
      initialData.userPreferences.notifications : true,
    darkModeEnabled: initialData.userPreferences?.darkMode !== undefined ? 
      initialData.userPreferences.darkMode : false,
    preferredLanguage: initialData.userPreferences?.language || "en"
  });
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData.profileImageUrl || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties (social links)
    if (name.startsWith("social.")) {
      const socialNetwork = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialNetwork]: value
        }
      }));
    } else if (name.startsWith("emergency.")) {
      const field = name.split(".")[1];
      const fieldMap: Record<string, string> = {
        "name": "emergencyContactName",
        "relationship": "emergencyContactRelationship",
        "phone": "emergencyContactPhone"
      };
      
      setFormData(prev => ({
        ...prev,
        [fieldMap[field]]: value
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, photoFile: file }));
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };
  
  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Basic validation
    if (!formData.displayName.trim()) errors.displayName = "Display name is required";
    if (!formData.username.trim()) errors.username = "Username is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    // Phone validation
    const phoneRegex = /^\+?[\d\s()-]{7,15}$/;
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      errors.phoneNumber = "Please enter a valid phone number";
    }
    
    // Website validation
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/;
    if (formData.website && !urlRegex.test(formData.website)) {
      errors.website = "Please enter a valid website URL";
    }
    
    // Social media validation
    Object.entries(formData.socialLinks).forEach(([key, value]) => {
      if (value && !urlRegex.test(value)) {
        errors[`social.${key}`] = "Please enter a valid URL";
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("You must be logged in to update your profile");
      return;
    }
    
    // Validate form
    if (!validate()) {
      // Scroll to first error field
      const firstErrorField = document.querySelector(`[name="${Object.keys(validationErrors)[0]}"]`);
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Format emergency contact
      const emergencyContact = 
        formData.emergencyContactName || formData.emergencyContactPhone 
          ? {
              name: formData.emergencyContactName,
              relationship: formData.emergencyContactRelationship,
              phoneNumber: formData.emergencyContactPhone
            }
          : undefined;
      
      // Format user preferences
      const userPreferences = {
        notifications: formData.notificationsEnabled,
        darkMode: formData.darkModeEnabled,
        language: formData.preferredLanguage
      };
      
      // Format date of birth
      const dateOfBirth = formData.dateOfBirth ? new Date(formData.dateOfBirth) : null;
      
      const result = await saveUserProfile({
        displayName: formData.displayName,
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        dateOfBirth,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        bio: formData.bio,
        driverLicense: formData.driverLicense,
        occupation: formData.occupation,
        website: formData.website,
        socialLinks: formData.socialLinks,
        preferredContactMethod: formData.preferredContactMethod,
        emergencyContact,
        userPreferences,
        onboardingCompleted: true,
      }, user, formData.photoFile);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to update profile");
      }
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const renderFieldError = (fieldName: string) => {
    if (!validationErrors[fieldName]) return null;
    
    return (
      <p className="text-xs text-red-500 mt-1">{validationErrors[fieldName]}</p>
    );
  };

  return (
    <div className="bg-card border rounded-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-6">Edit Profile</h2>
      
      {success && (
        <div className="bg-green-100 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-800 dark:text-green-300 px-4 py-3 rounded mb-4">
          <p className="font-medium">Success!</p>
          <p className="text-sm">Your profile has been updated successfully.</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 px-4 py-3 rounded mb-4">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="flex flex-col items-center mb-6">
          <Avatar className="h-24 w-24 mb-4">
            {previewUrl ? (
              <AvatarImage src={previewUrl} alt="Profile preview" />
            ) : (
              <AvatarFallback>{formData.displayName?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
            )}
          </Avatar>
          
          <div className="flex flex-wrap gap-2 justify-center">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleFileUpload}
              className="flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Photo
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleCameraCapture}
              className="flex items-center"
            >
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
            
            {/* Hidden inputs */}
            <input
              ref={fileInputRef}
              type="file"
              id="photoFile"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
              disabled={loading}
            />
            
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoChange}
              disabled={loading}
            />
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="basic" className="flex-1">Basic Info</TabsTrigger>
            <TabsTrigger value="contact" className="flex-1">Contact Details</TabsTrigger>
            <TabsTrigger value="driving" className="flex-1">Driving Info</TabsTrigger>
            <TabsTrigger value="preferences" className="flex-1">Preferences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium mb-1">Display Name</label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  className={`w-full p-2 border rounded text-base ${validationErrors.displayName ? 'border-red-500' : ''}`}
                  value={formData.displayName}
                  onChange={handleChange}
                  disabled={loading}
                />
                {renderFieldError('displayName')}
              </div>
              
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-1">
                  Username
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 inline-block text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">Your username must be unique and will be used in your profile URL</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className={`w-full p-2 border rounded text-base ${validationErrors.username ? 'border-red-500' : ''}`}
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                />
                {renderFieldError('username')}
              </div>
            </div>
            
            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-1">Bio</label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                className="w-full p-2 border rounded text-base"
                value={formData.bio}
                onChange={handleChange}
                disabled={loading}
                placeholder="Tell others a bit about yourself..."
              />
            </div>
            
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium mb-1">Date of Birth</label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                className="w-full p-2 border rounded text-base"
                value={formData.dateOfBirth}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="occupation" className="block text-sm font-medium mb-1">Occupation</label>
              <input
                id="occupation"
                name="occupation"
                type="text"
                className="w-full p-2 border rounded text-base"
                value={formData.occupation}
                onChange={handleChange}
                disabled={loading}
                placeholder="What do you do for work?"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="contact" className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`w-full p-2 border rounded text-base ${validationErrors.email ? 'border-red-500' : ''}`}
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
              {renderFieldError('email')}
            </div>
            
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">Phone Number</label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                className={`w-full p-2 border rounded text-base ${validationErrors.phoneNumber ? 'border-red-500' : ''}`}
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={loading}
                placeholder="+1 (555) 123-4567"
              />
              {renderFieldError('phoneNumber')}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium mb-1">City</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  className="w-full p-2 border rounded text-base"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              
              <div>
                <label htmlFor="state" className="block text-sm font-medium mb-1">State</label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  className="w-full p-2 border rounded text-base"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium mb-1">Address</label>
              <input
                id="address"
                name="address"
                type="text"
                className="w-full p-2 border rounded text-base"
                value={formData.address}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium mb-1">ZIP Code</label>
              <input
                id="zipCode"
                name="zipCode"
                type="text"
                className="w-full p-2 border rounded text-base"
                value={formData.zipCode}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="website" className="block text-sm font-medium mb-1">Website</label>
              <input
                id="website"
                name="website"
                type="url"
                className={`w-full p-2 border rounded text-base ${validationErrors.website ? 'border-red-500' : ''}`}
                value={formData.website}
                onChange={handleChange}
                disabled={loading}
                placeholder="https://yourwebsite.com"
              />
              {renderFieldError('website')}
            </div>
            
            <fieldset className="border rounded p-3">
              <legend className="text-sm font-medium px-2">Social Media Links</legend>
              
              <div className="space-y-3">
                <div>
                  <label htmlFor="social.facebook" className="block text-sm font-medium mb-1">Facebook</label>
                  <input
                    id="social.facebook"
                    name="social.facebook"
                    type="url"
                    className={`w-full p-2 border rounded text-base ${validationErrors['social.facebook'] ? 'border-red-500' : ''}`}
                    value={formData.socialLinks.facebook}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="https://facebook.com/username"
                  />
                  {renderFieldError('social.facebook')}
                </div>
                
                <div>
                  <label htmlFor="social.twitter" className="block text-sm font-medium mb-1">Twitter</label>
                  <input
                    id="social.twitter"
                    name="social.twitter"
                    type="url"
                    className={`w-full p-2 border rounded text-base ${validationErrors['social.twitter'] ? 'border-red-500' : ''}`}
                    value={formData.socialLinks.twitter}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="https://twitter.com/username"
                  />
                  {renderFieldError('social.twitter')}
                </div>
                
                <div>
                  <label htmlFor="social.instagram" className="block text-sm font-medium mb-1">Instagram</label>
                  <input
                    id="social.instagram"
                    name="social.instagram"
                    type="url"
                    className={`w-full p-2 border rounded text-base ${validationErrors['social.instagram'] ? 'border-red-500' : ''}`}
                    value={formData.socialLinks.instagram}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="https://instagram.com/username"
                  />
                  {renderFieldError('social.instagram')}
                </div>
                
                <div>
                  <label htmlFor="social.linkedin" className="block text-sm font-medium mb-1">LinkedIn</label>
                  <input
                    id="social.linkedin"
                    name="social.linkedin"
                    type="url"
                    className={`w-full p-2 border rounded text-base ${validationErrors['social.linkedin'] ? 'border-red-500' : ''}`}
                    value={formData.socialLinks.linkedin}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="https://linkedin.com/in/username"
                  />
                  {renderFieldError('social.linkedin')}
                </div>
              </div>
            </fieldset>
          </TabsContent>
          
          <TabsContent value="driving" className="space-y-4">
            <div>
              <label htmlFor="driverLicense" className="block text-sm font-medium mb-1">
                Driver's License Number
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-1 inline-block text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">Required for insurance purposes. This information is kept secure and only shown to car owners when necessary.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <input
                id="driverLicense"
                name="driverLicense"
                type="text"
                className="w-full p-2 border rounded text-base"
                value={formData.driverLicense}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <fieldset className="border rounded p-3">
              <legend className="text-sm font-medium px-2">Emergency Contact</legend>
              
              <div className="space-y-3">
                <div>
                  <label htmlFor="emergency.name" className="block text-sm font-medium mb-1">Contact Name</label>
                  <input
                    id="emergency.name"
                    name="emergency.name"
                    type="text"
                    className="w-full p-2 border rounded text-base"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label htmlFor="emergency.relationship" className="block text-sm font-medium mb-1">Relationship</label>
                  <input
                    id="emergency.relationship"
                    name="emergency.relationship"
                    type="text"
                    className="w-full p-2 border rounded text-base"
                    value={formData.emergencyContactRelationship}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Spouse, Parent, Friend, etc."
                  />
                </div>
                
                <div>
                  <label htmlFor="emergency.phone" className="block text-sm font-medium mb-1">Phone Number</label>
                  <input
                    id="emergency.phone"
                    name="emergency.phone"
                    type="tel"
                    className="w-full p-2 border rounded text-base"
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>
            </fieldset>
          </TabsContent>
          
          <TabsContent value="preferences" className="space-y-4">
            <div>
              <label htmlFor="preferredContactMethod" className="block text-sm font-medium mb-1">Preferred Contact Method</label>
              <select
                id="preferredContactMethod"
                name="preferredContactMethod"
                className="w-full p-2 border rounded text-base"
                value={formData.preferredContactMethod}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="sms">SMS</option>
                <option value="app">In-App Notification</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="preferredLanguage" className="block text-sm font-medium mb-1">Preferred Language</label>
              <select
                id="preferredLanguage"
                name="preferredLanguage"
                className="w-full p-2 border rounded text-base"
                value={formData.preferredLanguage}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notificationsEnabled">Enable Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive updates about your account and bookings
                  </p>
                </div>
                <Switch
                  id="notificationsEnabled"
                  checked={formData.notificationsEnabled}
                  onCheckedChange={(checked) => handleSwitchChange('notificationsEnabled', checked)}
                  disabled={loading}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="darkModeEnabled">Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Use dark theme by default
                  </p>
                </div>
                <Switch
                  id="darkModeEnabled"
                  checked={formData.darkModeEnabled}
                  onCheckedChange={(checked) => handleSwitchChange('darkModeEnabled', checked)}
                  disabled={loading}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
