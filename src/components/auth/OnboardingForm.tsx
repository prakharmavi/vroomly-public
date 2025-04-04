import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/firebase/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { UserProfileFormData, initialUserProfileFormData } from "@/firebase/db/model/usermodel";
import { saveUserProfile, isUsernameAvailable } from "@/firebase/db/services/userProfileService";
import { debounce } from "lodash";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

// Icons from lucide-react
import {
  Loader2,
  CheckCircle,
  XCircle,
  User,
  Phone,
  MapPin,
  Building,
  Map,
  Hash,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Save,
  AlertCircle,
  Upload,
  Camera,
  Image as ImageIcon
} from "lucide-react";

interface OnboardingFormProps {
  onComplete?: () => void;
}

// Step configuration
const STEPS = [
  { 
    title: "Personal Information", 
    description: "Tell us about yourself",
    icon: User,
    fields: ["displayName", "username", "phoneNumber"] as Array<keyof UserProfileFormData> 
  },
  {
    title: "Profile Photo",
    description: "Add a photo of yourself",
    icon: ImageIcon,
    fields: ["profilePhoto"] as Array<keyof UserProfileFormData>
  },
  { 
    title: "Address", 
    description: "Where do you live?",
    icon: MapPin,
    fields: ["address", "city", "state", "zipCode"] as Array<keyof UserProfileFormData> 
  },
  { 
    title: "Driver Details", 
    description: "Your driving information",
    icon: CreditCard,
    fields: ["driverLicense"] as Array<keyof UserProfileFormData> 
  }
];

export function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UserProfileFormData>(initialUserProfileFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    error: string;
  }>({ checking: false, available: null, error: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Initialize with user data if available
  useEffect(() => {
    if (user?.displayName) {
      setFormData(prev => ({ ...prev, displayName: user.displayName || "" }));
    }
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email || "" }));
    }
  }, [user]);

  // Check username availability
  const checkUsername = useCallback(
    debounce(async (username: string) => {
      if (!username || username.length < 3) {
        setUsernameStatus({ checking: false, available: null, error: "" });
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setUsernameStatus({
          checking: false,
          available: false,
          error: "Username can only contain letters, numbers, and underscores"
        });
        return;
      }

      setUsernameStatus(prev => ({ ...prev, checking: true }));
      try {
        const available = await isUsernameAvailable(username);
        setUsernameStatus({
          checking: false,
          available,
          error: available ? "" : "Username is already taken"
        });
      } catch (error) {
        console.error("Username check error:", error);
        setUsernameStatus({
          checking: false,
          available: false,
          error: "Error checking username"
        });
      }
    }, 500),
    [setUsernameStatus] 
  );

  useEffect(() => {
    if (formData.username) {
      checkUsername(formData.username);
    } else {
      setUsernameStatus({ checking: false, available: null, error: "" });
    }
    return () => checkUsername.cancel();
  }, [formData.username, checkUsername]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, profilePhoto: "File must be an image" }));
        return;
      }
      
      // Check if file is too large (2MB max for ImgBB free tier)
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profilePhoto: "Image must be less than 2MB" }));
        return;
      }
      
      setPhotoFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous errors
      setErrors(prev => ({ ...prev, profilePhoto: "" }));
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Basic validation - only checks if required fields are filled
  const validateCurrentStep = (): boolean => {
    const currentStepFields = STEPS[step - 1].fields;
    const newErrors: Record<string, string> = {};
    
    currentStepFields.forEach(field => {
      // Special validation for username
      if (field === "username" && formData[field]) {
        if (!usernameStatus.available) {
          newErrors[field] = usernameStatus.error || "Please choose a valid username";
        }
      } 
      // Skip validation for optional profile photo
      else if (field === "profilePhoto") {
        return; // Photo is optional, so skip validation
      }
      // Required field check for all fields
      else if (!formData[field] || (typeof formData[field] === "string" && !formData[field].trim())) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep(s => Math.min(s + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate("/auth");
      return;
    }
    
    if (!validateCurrentStep()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const dateOfBirth = formData.dateOfBirth ? new Date(formData.dateOfBirth) : null;
      
      // Try to save profile without photo if there's one provided
      // This avoids blocking the onboarding process due to image upload issues
      if (photoFile) {
        setUploadingPhoto(true);
        try {
          const result = await saveUserProfile({
            ...formData,
            dateOfBirth,
            onboardingCompleted: true
          }, user, photoFile);
          
          if (!result.success) {
            throw new Error(result.error || "Failed to save profile with photo");
          }
          
          if (onComplete) {
            onComplete();
          } else {
            navigate("/");
          }
          return; // Exit early on success
        } catch (photoError) {
          console.error("Image upload failed:", photoError);
          // If the photo upload fails, show a confirmation to continue without photo
          if (window.confirm("There was an issue uploading your profile photo. Do you want to continue without the photo?")) {
            // Continue with saving profile without the photo
            // Fall through to the code below
          } else {
            // User chose not to continue, don't navigate away
            throw new Error("Profile photo upload failed. Please try again later or skip the photo.");
          }
        }
      }
      
      // If we get here, either there was no photo or the user agreed to continue without one
      const result = await saveUserProfile({
        ...formData,
        dateOfBirth,
        onboardingCompleted: true
      }, user, null); // Pass null as photoFile to skip photo upload
      
      if (!result.success) {
        throw new Error(result.error || "Failed to save profile");
      }
      
      if (onComplete) {
        onComplete();
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setErrors({ submit: err instanceof Error ? err.message : "Failed to save profile" });
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
    }
  };

  const renderField = (name: keyof UserProfileFormData, label: string, type = "text", icon: React.ReactNode) => (
    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-2">
        {icon}
        <Label htmlFor={name} className="text-sm font-medium">
          {label}
        </Label>
      </div>
      
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={type}
          value={(formData[name] || "").toString()}
          onChange={handleChange}
          className={`w-full ${errors[name] ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          aria-invalid={errors[name] ? "true" : "false"}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
        />
        
        {name === "username" && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {usernameStatus.checking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {usernameStatus.available && <CheckCircle className="h-4 w-4 text-green-500" />}
            {usernameStatus.available === false && <XCircle className="h-4 w-4 text-red-500" />}
          </div>
        )}
      </div>
      
      {errors[name] && (
        <p className="text-red-500 text-xs flex items-center gap-1" id={`${name}-error`} role="alert">
          <AlertCircle className="h-3 w-3" />
          {errors[name]}
        </p>
      )}
    </div>
  );

  const renderPhotoUploadField = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Profile Photo</Label>
      </div>
      
      {photoPreview ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-primary">
            <img 
              src={photoPreview} 
              alt="Profile preview" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={removePhoto}
            className="text-destructive border-destructive hover:bg-destructive/10"
          >
            Remove Photo
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-4">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-center text-muted-foreground">
            Upload a profile photo or take a picture with your camera.
            <br />
            <span className="text-xs">(This is optional. If you skip, we'll generate an avatar for you)</span>
            <br />
            <span className="text-xs text-amber-500">Note: Images must be under 2MB</span>
          </p>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={triggerFileUpload}
              disabled={uploadingPhoto}
              className="flex items-center gap-2"
            >
              <Upload size={16} className="text-primary" />
              Upload Photo
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={triggerCameraCapture}
              disabled={uploadingPhoto}
              className="flex items-center gap-2"
            >
              <Camera size={16} className="text-primary" />
              Take Photo
            </Button>
          </div>
          
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
          
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>
      )}
      
      {errors.profilePhoto && (
        <p className="text-red-500 text-xs flex items-center gap-1" role="alert">
          <AlertCircle className="h-3 w-3" />
          {errors.profilePhoto}
        </p>
      )}
    </div>
  );

  const renderStepContent = () => {
    const currentStep = STEPS[step - 1];
    const StepIcon = currentStep.icon;
    
    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-primary/10 p-2 rounded-full">
            <StepIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">{currentStep.title}</CardTitle>
            <CardDescription>{currentStep.description}</CardDescription>
          </div>
        </div>
        
        {currentStep.fields.includes("displayName") && renderField("displayName", "Full Name", "text", <User className="h-4 w-4 text-muted-foreground" />)}
        {currentStep.fields.includes("username") && renderField("username", "Username", "text", <User className="h-4 w-4 text-muted-foreground" />)}
        {currentStep.fields.includes("phoneNumber") && renderField("phoneNumber", "Phone Number", "tel", <Phone className="h-4 w-4 text-muted-foreground" />)}
        
        {currentStep.fields.includes("profilePhoto") && renderPhotoUploadField()}
        
        {currentStep.fields.includes("address") && renderField("address", "Street Address", "text", <MapPin className="h-4 w-4 text-muted-foreground" />)}
        {currentStep.fields.includes("city") && renderField("city", "City", "text", <Building className="h-4 w-4 text-muted-foreground" />)}
        {currentStep.fields.includes("state") && renderField("state", "State", "text", <Map className="h-4 w-4 text-muted-foreground" />)}
        {currentStep.fields.includes("zipCode") && renderField("zipCode", "ZIP Code", "text", <Hash className="h-4 w-4 text-muted-foreground" />)}
        
        {currentStep.fields.includes("driverLicense") && renderField("driverLicense", "Driver's License", "text", <CreditCard className="h-4 w-4 text-muted-foreground" />)}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-0 md:border">
      <CardHeader className="pb-1">
        <Progress 
          value={(step / STEPS.length) * 100} 
          className="h-2 mb-4" 
          aria-label={`Step ${step} of ${STEPS.length}`}
        />
        
        <div className="flex justify-center space-x-6 py-2">
          {STEPS.map((s, i) => {
            const StepIcon = s.icon;
            return (
              <div 
                key={i}
                onClick={() => i < step && setStep(i + 1)}
                role="button"
                tabIndex={i < step ? 0 : -1}
                aria-label={`Go to step ${i + 1}: ${s.title}`}
                className="relative"
              >
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center 
                    ${step === i+1 ? "bg-primary text-primary-foreground" : 
                    step > i+1 ? "bg-primary/60 text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  <StepIcon className="h-5 w-5" />
                </div>
                {step === i+1 && (
                  <div className="absolute -bottom-5 left-0 right-0 text-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent>
          {renderStepContent()}
          
          {errors.submit && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t p-4">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            disabled={step === 1 || loading}
            className="flex items-center gap-1"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sm:inline">Back</span>
          </Button>
          
          {step < STEPS.length ? (
            <Button 
              onClick={handleNext} 
              className="flex items-center gap-1"
              type="button"
            >
              <span className="sm:inline">Next</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={loading}
              className="flex items-center gap-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> 
                  <span className="sm:inline">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span className="sm:inline">Complete</span>
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}