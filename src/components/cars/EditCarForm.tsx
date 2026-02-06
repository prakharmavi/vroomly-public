import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/firebase/auth/AuthContext";
import { Loader2, X, User, Upload, Camera, Info } from "lucide-react";
import { FuelType, TransmissionType } from "@/firebase/db/model/carmodel";
import { updateCarListing } from "@/firebase/db/services/updateCarListing";
import { getUserProfile } from "@/firebase/db/services/userProfileService";
import { UserProfile } from "@/firebase/db/model/usermodel";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { NumericInput } from "@/components/ui/custom-input";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getCarMakes, getCarModels, generateCarTitle } from "@/utils/carDataUtils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { uploadImage } from "@/utils/imageUploadService";

// Update the interface to remove title
interface CarFormData {
  description: string;
  price: number;
  location: string;
  imageUrls: string[]; // Changed from imageUrl to imageUrls array
  make: string;
  model: string;
  year: number;
  color: string;
  fuelType: FuelType;
  transmission: TransmissionType;
  seats: number;
  availableFrom: Date;
  availableTo: Date;
  features: string[];
}

interface EditCarFormProps {
  carId: string;
  initialData: any; // This will be the car data from Firestore
  onSubmit?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function EditCarForm({ 
  carId, 
  initialData, 
  onSubmit, 
  onCancel,
  isLoading = false 
}: EditCarFormProps) {
  const [formData, setFormData] = useState<CarFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [makeOpen, setMakeOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const makes = getCarMakes();
  const models = formData?.make ? getCarModels(formData.make) : [];

  // Fetch owner profile
  useEffect(() => {
    async function fetchOwnerProfile() {
      if (!user?.uid) return;
      
      try {
        setLoadingProfile(true);
        const profile = await getUserProfile(user.uid);
        setOwnerProfile(profile);
        
        // Auto-fill location from user profile if not set in car data
        if (profile && formData && (!formData.location || formData.location === "")) {
          const locationFromProfile = [profile.city, profile.state]
            .filter(Boolean)
            .join(", ");
            
          if (locationFromProfile) {
            setFormData(prev => prev ? {
              ...prev,
              location: locationFromProfile
            } : null);
          }
        }
      } catch (err) {
        console.error("Error fetching owner profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    
    fetchOwnerProfile();
  }, [user, formData]);

  // Convert Firestore data to form data
  useEffect(() => {
    if (initialData) {
      try {
        // Extract car info from the nested structure
        const { carInfo } = initialData;
        
        // Convert Firestore Timestamp to Date
        const availableFrom = initialData.availableFrom?.toDate ? 
          initialData.availableFrom.toDate() : 
          new Date(initialData.availableFrom);
        
        const availableTo = initialData.availableTo?.toDate ? 
          initialData.availableTo.toDate() : 
          new Date(initialData.availableTo);
        
        // Process imageUrls to ensure it's always an array
        const imageUrls = Array.isArray(initialData.imageUrls) 
          ? initialData.imageUrls 
          : initialData.imageUrl 
            ? [initialData.imageUrl] 
            : ["https://placehold.co/600x400?text=Invalid+Image"];
        
        // Set up image previews based on the loaded URLs
        setImagePreviews(imageUrls);
        
        // Create a flat structure for the form (removing the title field)
        setFormData({
          description: initialData.description || "",
          price: initialData.price || 0,
          location: initialData.location || "",
          imageUrls: imageUrls,
          make: carInfo?.make || "",
          model: carInfo?.model || "",
          year: carInfo?.year || new Date().getFullYear(),
          color: carInfo?.color || "",
          fuelType: carInfo?.fuelType || FuelType.GASOLINE,
          transmission: carInfo?.transmission || TransmissionType.AUTOMATIC,
          seats: carInfo?.seats || 5,
          availableFrom: availableFrom,
          availableTo: availableTo,
          features: initialData.features || []
        });
      } catch (error) {
        console.error("Error parsing car data:", error);
        setError("Failed to load car data correctly");
      }
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (!formData) return;
    
    setFormData(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        [name]: name === "price" || name === "year" || name === "seats" 
          ? parseInt(value) || 0 
          : name === "fuelType" 
            ? value as FuelType 
            : name === "transmission" 
              ? value as TransmissionType 
              : value
      };
    });
  };

  const handleNumericChange = (name: string, value: number | null) => {
    if (!formData) return;
    
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: value === null ? 0 : value
      };
    });
  };

  const handleFeaturesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return;
    
    const features = e.target.value.split(',').map(feature => feature.trim()).filter(Boolean);
    setFormData(prev => {
      if (!prev) return prev;
      return { ...prev, features };
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return;
    
    const { name, value } = e.target;
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: new Date(value)
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData) {
      return;
    }
    
    // Validate user profile is complete before allowing submission
    if (!ownerProfile?.onboardingCompleted) {
      setError("Please complete your profile setup before updating car listings.");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      // Generate title from make, model, and year
      const generatedTitle = generateCarTitle(formData.make, formData.model, formData.year);
      
      // Convert form data to expected format for API
      const carListingData = {
        owner: user.uid,
        ownerUsername: ownerProfile?.username || "",
        ownerDisplayName: ownerProfile?.displayName || "",
        ownerProfileImage: ownerProfile?.profileImageUrl || "",
        title: generatedTitle, // Use generated title
        description: formData.description,
        price: formData.price,
        location: formData.location,
        imageUrls: formData.imageUrls,
        carInfo: {
          make: formData.make,
          model: formData.model,
          year: formData.year,
          color: formData.color,
          fuelType: formData.fuelType,
          transmission: formData.transmission,
          seats: formData.seats
        },
        availableFrom: formData.availableFrom,
        availableTo: formData.availableTo,
        features: formData.features,
        updatedAt: new Date()
      };
      
      // Call updateCarListing API
      const result = await updateCarListing(carId, carListingData, user);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to update car listing");
      }
      
      setSuccess(true);
      
      // Call the onSubmit callback after a brief delay to show success state
      setTimeout(() => {
        if (onSubmit) onSubmit();
      }, 1000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update your car listing. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return;
    if (e.target.files && e.target.files.length > 0) {
      setUploadingImages(true);
      try {
        const files = Array.from(e.target.files);
        const tempPreviews: string[] = [];
        
        // Create temporary previews
        for (const file of files) {
          const imageUrl = URL.createObjectURL(file);
          tempPreviews.push(imageUrl);
        }
        
        setImagePreviews(prev => [...prev, ...tempPreviews]);

        // Upload to Firebase Storage
        const uploadedUrls: string[] = [];
        for (const file of files) {
          const uploadedUrl = await uploadImage(file, 'cars');
          uploadedUrls.push(uploadedUrl);
        }
        
        // Update form data with the uploaded URLs
        setFormData(prev => {
          if (!prev) return prev;
          const allImageUrls = [...prev.imageUrls, ...uploadedUrls];
          return {
            ...prev,
            imageUrls: allImageUrls
          };
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload images");
        console.error(err);
      } finally {
        setUploadingImages(false);
      }
    }
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return;
    if (e.target.files && e.target.files.length > 0) {
      setUploadingImages(true);
      try {
        const file = e.target.files[0];
        const tempPreview = URL.createObjectURL(file);
        
        setImagePreviews(prev => [...prev, tempPreview]);

        // Upload to Firebase Storage
        const uploadedUrl = await uploadImage(file, 'cars');
        
        // Update form data with the uploaded URL
        setFormData(prev => {
          if (!prev) return prev;
          const allImageUrls = [...prev.imageUrls, uploadedUrl];
          return {
            ...prev,
            imageUrls: allImageUrls
          };
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload image");
        console.error(err);
      } finally {
        setUploadingImages(false);
      }
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const triggerCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const removeImage = (indexToRemove: number) => {
    if (!formData) return;
    
    // Remove from previews
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    
    // Remove from form data
    setFormData(prev => {
      if (!prev) return prev;
      const updatedImageUrls = prev.imageUrls.filter((_, index) => index !== indexToRemove);
      return {
        ...prev,
        imageUrls: updatedImageUrls.length ? updatedImageUrls : ["https://placehold.co/600x400?text=No+Image"]
      };
    });
  };

  const moveImageToMain = (index: number) => {
    if (!formData || index === 0) return; // Already the main image
    
    // Update form data to move the selected image to be first in the array
    setFormData(prev => {
      if (!prev) return prev;
      const newImageUrls = [...prev.imageUrls];
      const movedImage = newImageUrls.splice(index, 1)[0];
      newImageUrls.unshift(movedImage);
      
      return {
        ...prev,
        imageUrls: newImageUrls
      };
    });
    
    // Also update previews to match
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      const movedPreview = newPreviews.splice(index, 1)[0];
      newPreviews.unshift(movedPreview);
      
      return newPreviews;
    });
  };

  // Show loading state when initially loading the form data
  if (!formData || isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex justify-center items-center py-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 text-primary" />
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-2xl mx-auto shadow-sm">
        <CardHeader className="space-y-1.5">
          <CardTitle>Edit Car Listing</CardTitle>
          <CardDescription>
            Update the details of your car listing
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Owner profile section */}
          <AnimatePresence>
            {ownerProfile && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 pb-4"
              >
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  {ownerProfile.profileImageUrl ? (
                    <AvatarImage src={ownerProfile.profileImageUrl} alt={ownerProfile.displayName} />
                  ) : (
                    <AvatarFallback>
                      <User className="h-5 w-5 text-muted-foreground" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="font-medium">{ownerProfile.displayName || "Owner"}</p>
                  <p className="text-sm text-muted-foreground">@{ownerProfile.username}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.div layout>
            <Separator />
          </motion.div>
          
          <AnimatePresence>
            {!ownerProfile && !loadingProfile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Profile Incomplete</AlertTitle>
                  <AlertDescription>
                    Please complete your profile setup for the best experience.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert>
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 10 }}
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </motion.div>
                  <AlertTitle>Success!</AlertTitle>
                  <AlertDescription>
                    Your car listing has been updated successfully.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {/* Show warning if profile is incomplete */}
            {ownerProfile && !ownerProfile.onboardingCompleted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Profile Incomplete</AlertTitle>
                  <AlertDescription>
                    Complete your profile to enable listing updates.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {/* Remove title input field - we'll generate it automatically */}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <Label htmlFor="make">Make</Label>
                  <Popover open={makeOpen} onOpenChange={setMakeOpen}>
                    <PopoverTrigger asChild>
                      <motion.div whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={makeOpen}
                          className="w-full justify-between h-11"
                          disabled={loading}
                        >
                          {formData.make || "Select make..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </motion.div>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search make..." />
                        <CommandEmpty>No make found. Type to add custom make.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {makes.map((make) => (
                            <CommandItem
                              key={make}
                              value={make}
                              onSelect={(currentValue) => {
                                const selectedMake = currentValue === formData.make ? "" : currentValue;
                                setFormData(prev => ({
                                  ...prev!,
                                  make: selectedMake,
                                  model: "" // Reset model when make changes
                                }));
                                setMakeOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.make === make ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {make}
                            </CommandItem>
                          ))}
                          <CommandItem 
                            value="custom-make"
                            onSelect={() => {
                              const customMake = prompt("Enter custom make:");
                              if (customMake) {
                                setFormData(prev => ({
                                  ...prev!,
                                  make: customMake,
                                  model: "" // Reset model for custom make
                                }));
                              }
                              setMakeOpen(false);
                            }}
                          >
                            <span className="text-muted-foreground">+ Add custom make</span>
                          </CommandItem>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <Label htmlFor="model">Model</Label>
                  <Popover open={modelOpen} onOpenChange={setModelOpen}>
                    <PopoverTrigger asChild>
                      <motion.div whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={modelOpen}
                          className="w-full justify-between h-11"
                          disabled={loading || !formData.make}
                        >
                          {formData.model || "Select model..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </motion.div>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search model..." />
                        <CommandEmpty>No model found. Type to add custom model.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {models.map((model) => (
                            <CommandItem
                              key={model}
                              value={model}
                              onSelect={(currentValue) => {
                                const selectedModel = currentValue === formData.model ? "" : currentValue;
                                setFormData(prev => ({
                                  ...prev!,
                                  model: selectedModel
                                }));
                                setModelOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.model === model ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {model}
                            </CommandItem>
                          ))}
                          <CommandItem 
                            value="custom-model"
                            onSelect={() => {
                              const customModel = prompt("Enter custom model:");
                              if (customModel) {
                                setFormData(prev => ({
                                  ...prev!,
                                  model: customModel
                                }));
                              }
                              setModelOpen(false);
                            }}
                          >
                            <span className="text-muted-foreground">+ Add custom model</span>
                          </CommandItem>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </motion.div>
              </div>
              
              {/* Display the auto-generated title */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Generated Title</Label>
                  <TooltipProvider>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">The title is generated automatically from the make, model and year</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <motion.div 
                  className="p-2.5 border rounded-md bg-muted/30 h-11 flex items-center font-medium"
                  animate={{
                    backgroundColor: formData.make && formData.model && formData.year ? 
                      ["rgba(0,0,0,0.05)", "rgba(0,0,0,0.03)"] : 
                      "rgba(0,0,0,0.03)"
                  }}
                  transition={{ 
                    duration: 0.5, 
                    repeat: formData.make && formData.model && formData.year ? Infinity : 0,
                    repeatType: "reverse" 
                  }}
                >
                  {formData.make && formData.model && formData.year ? 
                    generateCarTitle(formData.make, formData.model, formData.year) : 
                    "Complete car details to generate title"}
                </motion.div>
              </motion.div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <Label htmlFor="year">Year</Label>
                  <NumericInput
                    id="year"
                    value={formData.year || null}
                    onChange={(value) => handleNumericChange('year', value)}
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    placeholder="e.g., 2022"
                    disabled={loading}
                    required
                    allowEmpty={false}
                    className="h-11"
                  />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    name="color"
                    placeholder="e.g., Red"
                    value={formData.color}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    className="h-11"
                  />
                </motion.div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <Label htmlFor="seats">Seats</Label>
                  <NumericInput
                    id="seats"
                    value={formData.seats || null}
                    onChange={(value) => handleNumericChange('seats', value)}
                    min={1}
                    max={10}
                    placeholder="e.g., 5"
                    disabled={loading}
                    required
                    allowEmpty={false}
                    className="h-11"
                  />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <FormSelect
                    id="fuelType"
                    name="fuelType"
                    label="Fuel Type"
                    value={formData.fuelType}
                    onChange={(value) => handleChange({ target: { name: 'fuelType', value }} as any)}
                    options={[
                      { value: FuelType.GASOLINE, label: 'Gasoline' },
                      { value: FuelType.DIESEL, label: 'Diesel' },
                      { value: FuelType.ELECTRIC, label: 'Electric' },
                      { value: FuelType.HYBRID, label: 'Hybrid' },
                      { value: FuelType.PLUGIN_HYBRID, label: 'Plug-in Hybrid' }
                    ]}
                    disabled={loading}
                    required
                  />
                </motion.div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-2"
                >
                  <FormSelect
                    id="transmission"
                    name="transmission"
                    label="Transmission"
                    value={formData.transmission}
                    onChange={(value) => handleChange({ target: { name: 'transmission', value }} as any)}
                    options={[
                      { value: TransmissionType.AUTOMATIC, label: 'Automatic' },
                      { value: TransmissionType.MANUAL, label: 'Manual' }
                    ]}
                    disabled={loading}
                    required
                  />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-2"
                >
                  <Label htmlFor="price">
                    <div className="flex items-center gap-1.5">
                      Price per Day ($)
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Enter the daily rental price in USD</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </Label>
                  <NumericInput
                    id="price"
                    value={formData.price || null}
                    onChange={(value) => handleNumericChange('price', value)}
                    min={0}
                    step={0.01}
                    placeholder="e.g., 49.99"
                    disabled={loading}
                    required
                    allowEmpty={false}
                    className="h-11"
                  />
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="space-y-2"
              >
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Describe your car and rental conditions"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  className="min-h-[100px] transition-all resize-y"
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="space-y-2"
              >
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder={ownerProfile ? `e.g., ${ownerProfile.city || ''}, ${ownerProfile.state || ''}` : "e.g., San Francisco, CA"}
                  value={formData?.location || ""}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  className="h-11"
                />
                <AnimatePresence>
                  {ownerProfile && !formData?.location && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      <Button 
                        type="button"
                        variant="link"
                        size="sm"
                        className="p-0 h-auto mt-1 text-xs"
                        onClick={() => {
                          if (ownerProfile.city || ownerProfile.state) {
                            const locationFromProfile = [ownerProfile.city, ownerProfile.state]
                              .filter(Boolean)
                              .join(", ");
                            
                            setFormData(prev => prev ? {
                              ...prev,
                              location: locationFromProfile
                            } : null);
                          }
                        }}
                      >
                        <motion.span 
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          Use my profile location
                        </motion.span>
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="space-y-2"
                >
                  <Label htmlFor="availableFrom">Available From</Label>
                  <Input
                    id="availableFrom"
                    name="availableFrom"
                    type="date"
                    value={formData.availableFrom.toISOString().split('T')[0]}
                    onChange={handleDateChange}
                    disabled={loading}
                    required
                    className="h-11"
                  />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="space-y-2"
                >
                  <Label htmlFor="availableTo">Available To</Label>
                  <Input
                    id="availableTo"
                    name="availableTo"
                    type="date"
                    value={formData.availableTo.toISOString().split('T')[0]}
                    onChange={handleDateChange}
                    disabled={loading}
                    required
                    className="h-11"
                  />
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="space-y-2"
              >
                <Label htmlFor="features">Features (comma separated)</Label>
                <Input
                  id="features"
                  name="features"
                  placeholder="e.g., GPS, Bluetooth, Sunroof"
                  value={formData.features.join(', ')}
                  onChange={handleFeaturesChange}
                  disabled={loading}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Separate multiple features with commas
                </p>
              </motion.div>
              
              {/* Car Photos Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="space-y-3 pt-2"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Car Photos</Label>
                  <Badge variant="outline" className="text-xs">
                    {imagePreviews.length} {imagePreviews.length === 1 ? 'photo' : 'photos'}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <motion.button 
                    type="button" 
                    onClick={triggerFileUpload}
                    disabled={loading || uploadingImages}
                    className="flex items-center gap-2 px-3 py-2 border rounded hover:bg-muted transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {uploadingImages ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} className="text-primary" />}
                    <span>Upload Photos</span>
                  </motion.button>
                  
                  <motion.button 
                    type="button" 
                    onClick={triggerCameraCapture}
                    disabled={loading || uploadingImages}
                    className="flex items-center gap-2 px-3 py-2 border rounded hover:bg-muted transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {uploadingImages ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} className="text-primary" />}
                    <span>Take Photo</span>
                  </motion.button>
                  
                  {/* Hidden file inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    multiple
                  />
                  
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraCapture}
                    className="hidden"
                  />
                </div>
                
                {/* Image previews */}
                <AnimatePresence>
                  {imagePreviews.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3"
                    >
                      <ScrollArea className="h-48 rounded-md border">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3">
                          {imagePreviews.map((preview, index) => (
                            <motion.div 
                              key={preview + index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ type: "spring", stiffness: 300, damping: 25 }}
                              className="relative group aspect-square"
                            >
                              <div className={`relative h-full w-full overflow-hidden rounded-md ${
                                index === 0 ? 'ring-2 ring-primary' : 'ring-1 ring-border'
                              }`}>
                                <motion.img 
                                  src={preview} 
                                  alt={`Car preview ${index + 1}`} 
                                  className="h-full w-full object-cover cursor-pointer"
                                  whileHover={{ scale: 1.05 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                  onClick={() => moveImageToMain(index)}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "https://placehold.co/600x400?text=Invalid+Image";
                                  }}
                                />
                              </div>
                              
                              <motion.button
                                type="button"
                                className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(index)}
                                disabled={uploadingImages}
                                whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.85)" }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <X size={14} />
                              </motion.button>
                              
                              {index === 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.1 }}
                                >
                                  <Badge 
                                    className="absolute bottom-1 left-1" 
                                    variant="secondary"
                                  >
                                    Main Photo
                                  </Badge>
                                </motion.div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xs text-muted-foreground mt-2 text-center"
                      >
                        Click on an image to set it as the main photo. Drag to scroll.
                      </motion.p>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border border-dashed rounded-md p-8 text-center text-muted-foreground"
                    >
                      <motion.div 
                        className="flex flex-col items-center gap-2"
                        initial={{ y: 10 }}
                        animate={{ y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      >
                        <Camera className="h-8 w-8 opacity-50" />
                        <p>No photos added yet</p>
                        <p className="text-xs">Upload photos or take one with your camera</p>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <AnimatePresence>
                  {uploadingImages && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-center py-2 text-muted-foreground flex items-center justify-center gap-2 bg-muted/50 rounded-md"
                    >
                      <Loader2 size={16} className="animate-spin" />
                      <span>Uploading images to server...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              disabled={loading} 
              className="w-full sm:w-auto"
              asChild
            >
              <motion.button 
                whileHover={{ scale: 1.01 }} 
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
            </Button>
          )}
          
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={loading || (ownerProfile ? !ownerProfile.onboardingCompleted : false)} 
            className="w-full sm:w-auto"
            asChild
          >
            <motion.button
              whileHover={{ scale: 1.01 }} 
              whileTap={{ scale: 0.98 }}
              disabled={loading || (ownerProfile ? !ownerProfile.onboardingCompleted : false)}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                "Update Listing"
              )}
            </motion.button>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}