import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/firebase/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { CarListingData, FuelType, TransmissionType } from "@/firebase/db/model/carmodel";
import { addCarListing } from "@/firebase/db/services/addCarListing";
import { decodeVin, VinLookupResult } from "../../utils/vinLookupService";
import { Camera, Upload, X, Loader2, CalendarIcon, PlusCircle, HelpCircle } from "lucide-react";
import { NumericInput } from "@/components/ui/custom-input";
import { motion, AnimatePresence } from "framer-motion";
import { uploadToImgbb } from "@/utils/imageUploadService";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Update the interface to include VIN lookup
interface CarFormData {
  vin: string;
  year: number;
  description: string;
  price: number;
  location: string;
  imageUrls: string[];
  features: string[];
  availableFrom: Date;
  availableTo: Date;
}

const initialFormData: CarFormData = {
  vin: "",
  year: new Date().getFullYear(),
  description: "",
  price: 0,
  location: "",
  imageUrls: [],
  features: [],
  availableFrom: new Date(),
  availableTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
};

interface AddCarFormProps {
  onSubmit?: () => void;
  onCancel?: () => void;
}

export function AddCarForm({ onSubmit, onCancel }: AddCarFormProps) {
  const [formData, setFormData] = useState<CarFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [carInfo, setCarInfo] = useState<VinLookupResult["data"] | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [newFeature, setNewFeature] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Generate years array (from 1900 to current year)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "price" ? parseInt(value) || 0 : value
    }));
  };

  const handleNumericChange = (name: string, value: number | null) => {
    setFormData(prev => ({
      ...prev,
      [name]: value === null ? 0 : value
    }));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadingImages(true);
      try {
        const files = Array.from(e.target.files);
        const tempPreviews: string[] = [];

        for (const file of files) {
          const imageUrl = URL.createObjectURL(file);
          tempPreviews.push(imageUrl);
        }

        setImagePreviews(prev => [...prev, ...tempPreviews]);

        const uploadedUrls: string[] = [];
        for (const file of files) {
          const uploadedUrl = await uploadToImgbb(file);
          uploadedUrls.push(uploadedUrl);
        }

        setFormData(prev => ({
          ...prev,
          imageUrls: [...prev.imageUrls, ...uploadedUrls]
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload images");
      } finally {
        setUploadingImages(false);
      }
    }
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadingImages(true);
      try {
        const file = e.target.files[0];
        const tempPreview = URL.createObjectURL(file);

        setImagePreviews(prev => [...prev, tempPreview]);

        const uploadedUrl = await uploadToImgbb(file);

        setFormData(prev => ({
          ...prev,
          imageUrls: [...prev.imageUrls, uploadedUrl]
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload image");
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
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate("/auth");
      return;
    }

    // Validate VIN and year
    if (!formData.vin || formData.vin.length !== 17) {
      setError("Please enter a valid 17-character VIN");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Perform VIN lookup first
      const vinResult = await decodeVin(formData.vin, formData.year);
      if (!vinResult.success || !vinResult.data) {
        throw new Error(vinResult.error || "Failed to decode VIN");
      }

      const vinData = vinResult.data;
      setCarInfo(vinData);

      // Create car listing data with proper type casting
      const carListingData: CarListingData = {
        owner: user.uid,
        title: `${vinData.make} ${vinData.model} ${vinData.year}`,
        description: formData.description,
        price: formData.price,
        location: formData.location,
        imageUrls: formData.imageUrls,
        carInfo: {
          make: vinData.make,
          model: vinData.model,
          year: vinData.year,
          color: vinData.color,
          seats: vinData.seats,
          fuelType: vinData.fuelType as FuelType || FuelType.GASOLINE,
          transmission: vinData.transmission as TransmissionType || TransmissionType.AUTOMATIC
        },
        availableFrom: formData.availableFrom,
        availableTo: formData.availableTo,
        features: formData.features
      };

      const submitResult = await addCarListing(carListingData, user);

      if (!submitResult.success) {
        throw new Error(submitResult.error || "Failed to add car listing");
      }

      setFormData(initialFormData);
      setImagePreviews([]);
      if (onSubmit) onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add your car listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto p-4 sm:p-6 bg-card rounded-lg border shadow-sm"
    >
      <h2 className="text-xl sm:text-2xl font-bold mb-6">List Your Car</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-2 mb-1.5">
              <label htmlFor="vin" className="block text-sm font-medium">
                Vehicle Identification Number (VIN)
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm">
                    <p>A VIN is a 17-character code unique to your vehicle. It's used to identify your car.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-3">
              <Input
                id="vin"
                name="vin"
                value={formData.vin}
                onChange={handleChange}
                placeholder="Enter 17-character VIN"
                className="font-mono"
                maxLength={17}
                disabled={loading}
              />
              <div className="text-xs text-muted-foreground space-y-2">
                <p className="font-medium">Where to find your VIN:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Driver's side dashboard (visible through the windshield)</li>
                  <li>Driver's side door jamb (open the door and look for a sticker)</li>
                  <li>Vehicle registration or insurance documents</li>
                  <li>Owner's manual or service records</li>
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <label htmlFor="year" className="block text-sm font-medium mb-1.5">Year</label>
            <Select
              value={formData.year.toString()}
              onValueChange={(value) => handleNumericChange('year', parseInt(value))}
              disabled={loading}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent className="max-h-[240px]">
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        </div>

        {carInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 border rounded-md bg-muted"
          >
            <h3 className="font-medium mb-2">Vehicle Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Make: {carInfo.make}</div>
              <div>Model: {carInfo.model}</div>
              <div>Year: {carInfo.year}</div>
              {carInfo.fuelType && <div>Fuel Type: {carInfo.fuelType}</div>}
              {carInfo.transmission && <div>Transmission: {carInfo.transmission}</div>}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <label htmlFor="description" className="block text-sm font-medium mb-1.5">Description</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Describe your car and rental conditions"
            className="w-full p-3 border rounded text-base"
            value={formData.description}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <label htmlFor="price" className="block text-sm font-medium mb-1.5">Price per Day ($)</label>
            <NumericInput
              id="price"
              value={formData.price || null}
              onChange={(value) => handleNumericChange('price', value)}
              min={0}
              step={0.01}
              className="w-full p-2 border rounded text-base h-11"
              placeholder="e.g., 49.99"
              disabled={loading}
              required
              allowEmpty={false}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <label htmlFor="location" className="block text-sm font-medium mb-1.5">Location</label>
            <input
              id="location"
              name="location"
              type="text"
              placeholder="e.g., San Francisco, CA"
              className="w-full p-2 border rounded text-base h-11"
              value={formData.location}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <label htmlFor="availableFrom" className="block text-sm font-medium mb-1.5">Available From</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-11"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.availableFrom ? (
                    format(formData.availableFrom, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.availableFrom}
                  onSelect={(date) => setFormData(prev => ({ ...prev, availableFrom: date || new Date() }))}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <label htmlFor="availableTo" className="block text-sm font-medium mb-1.5">Available To</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-11"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.availableTo ? (
                    format(formData.availableTo, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.availableTo}
                  onSelect={(date) => setFormData(prev => ({ ...prev, availableTo: date || new Date() }))}
                  disabled={(date) => date < formData.availableFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <label className="block text-sm font-medium mb-1.5">Features</label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Add a feature (e.g., GPS, Bluetooth)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addFeature();
                  }
                }}
              />
              <Button type="button" onClick={addFeature} size="icon">
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.features.map((feature, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-3 py-1.5"
                >
                  {feature}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 pl-2 hover:bg-transparent"
                    onClick={() => removeFeature(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              {formData.features.length === 0 && (
                <p className="text-sm text-muted-foreground">No features added yet</p>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <label className="block text-sm font-medium mb-1">Car Photos</label>

          <div className="flex flex-wrap gap-2 mb-3">
            <motion.button
              type="button"
              className="flex items-center gap-2 px-3 py-2 border rounded hover:bg-muted transition-colors"
              onClick={triggerFileUpload}
              disabled={loading || uploadingImages}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {uploadingImages ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} className="text-primary" />}
              <span>Upload Photos</span>
            </motion.button>

            <motion.button
              type="button"
              className="flex items-center gap-2 px-3 py-2 border rounded hover:bg-muted transition-colors"
              onClick={triggerCameraCapture}
              disabled={loading || uploadingImages}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {uploadingImages ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} className="text-primary" />}
              <span>Take Photo</span>
            </motion.button>

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

          <AnimatePresence>
            {imagePreviews.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3"
              >
                {imagePreviews.map((preview, index) => (
                  <motion.div
                    key={preview + index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative group aspect-square"
                  >
                    <img
                      src={preview}
                      alt={`Car preview ${index + 1}`}
                      className={`w-full h-full object-cover rounded-md transition-all duration-200 ${
                        index === 0 ? 'ring-2 ring-primary' : 'ring-1 ring-border hover:ring-primary/50'
                      }`}
                      onClick={() => {
                        setFormData(prev => {
                          if (index === 0) return prev;

                          const newImageUrls = [...prev.imageUrls];
                          const movedImage = newImageUrls.splice(index, 1)[0];
                          newImageUrls.unshift(movedImage);

                          return {
                            ...prev,
                            imageUrls: newImageUrls
                          };
                        });

                        setImagePreviews(prev => {
                          if (index === 0) return prev;

                          const newPreviews = [...prev];
                          const movedPreview = newPreviews.splice(index, 1)[0];
                          newPreviews.unshift(movedPreview);

                          return newPreviews;
                        });
                      }}
                    />
                    <motion.button
                      type="button"
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                      disabled={uploadingImages}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X size={14} />
                    </motion.button>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-sm">
                        Main Photo
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {imagePreviews.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border border-dashed rounded-lg p-8 text-center text-muted-foreground flex flex-col items-center gap-2"
              >
                <Camera size={32} className="opacity-50" />
                <p>No photos added yet. Upload photos or take one with your camera.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {uploadingImages && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-2 text-muted-foreground flex items-center justify-center gap-2 bg-muted/50 rounded-md"
              >
                <Loader2 size={16} className="animate-spin" />
                <span>Uploading images to server...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-destructive/10 text-destructive p-3 rounded-md text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2"
        >
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading || uploadingImages}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading || uploadingImages || formData.imageUrls.length === 0}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </span>
            ) : (
              "List Your Car"
            )}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}
