import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/firebase/auth/AuthContext";
import { 
  CalendarDays, MapPin,  User, ArrowLeft, Loader2, Car, Settings, 
  ChevronLeft, ChevronRight, Fuel, Calendar, PaintBucket, CircleDashed, CheckCircle
} from "lucide-react";
import { FuelType, TransmissionType } from "@/firebase/db/model/carmodel";
import { getCarListingById } from "@/firebase/db/services/getCarListings";
import { getUserProfile } from "@/firebase/db/services/userProfileService";
import { BookingForm } from "@/components/bookings/BookingForm";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface CarListing {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  imageUrls: string[];
  owner: string;
  carInfo: {
    make: string;
    model: string;
    year: number;
    color: string;
    fuelType: FuelType;
    transmission: TransmissionType;
    seats: number;
  };
  availableFrom: {
    toDate: () => Date;
  };
  availableTo: {
    toDate: () => Date;
  };
  features: string[];
}

// Component for image carousel
const ImageGallery = ({ images }: { images: string[] }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextImage = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-lg">
      {/* Main image */}
      <div className="relative aspect-video md:aspect-auto md:h-[400px] w-full bg-muted">
        <img
          src={images[activeIndex]}
          alt="Car"
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        
        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
        
        {/* Image count indicator */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
          {activeIndex + 1} / {images.length}
        </div>
      </div>
      
      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`relative flex-shrink-0 w-20 h-14 rounded overflow-hidden 
                ${activeIndex === index ? 'ring-2 ring-primary' : 'opacity-70'}`}
            >
              <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Feature badge component
const FeatureBadge = ({ children }: { children: React.ReactNode }) => (
  <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-2">
    {children}
  </Badge>
);

export function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [car, setCar] = useState<CarListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [owner, setOwner] = useState<{ username: string; displayName: string } | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    async function fetchCarDetails() {
      try {
        setLoading(true);
        
        // Make sure id is defined
        if (!id) {
          setError("Invalid car listing ID");
          return;
        }
        
        const carData = await getCarListingById(id);
        
        if (!carData) {
          setError("Car listing not found");
          return;
        }
        
        // Type check to ensure carData has the expected structure
        if (!('owner' in carData)) {
          console.error("Car data is missing expected properties:", carData);
          setError("Invalid car data format received");
          return;
        }
        
        // Process imageUrls to ensure it's always an array
        const processedCar = {
          ...carData,
          imageUrls: Array.isArray((carData as any).imageUrls) 
            ? (carData as any).imageUrls 
            : (carData as any).imageUrl ? [(carData as any).imageUrl] : []
        };
        
        setCar(processedCar as CarListing);
        
        // Fetch owner information
        if (carData.owner && typeof carData.owner === 'string') {
          try {
            const ownerProfile = await getUserProfile(carData.owner);
            if (ownerProfile) {
              setOwner({
                username: ownerProfile.username,
                displayName: ownerProfile.displayName
              });
            }
          } catch (ownerErr) {
            console.error("Error fetching owner details:", ownerErr);
            // Continue without owner details rather than failing the whole page
          }
        } else {
          console.warn("Owner property is not a valid string:", carData.owner);
        }
      } catch (err) {
        console.error("Error fetching car details:", err);
        setError(err instanceof Error ? err.message : "Failed to load car details. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchCarDetails();
  }, [id]);


  const handleBookingSuccess = () => {
    setBookingSuccess(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading car details...</p>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Car Not Found</h2>
        <p className="text-muted-foreground mb-6">
          {error || "We couldn't find the car you're looking for."}
        </p>
        <Button onClick={() => navigate("/cars")}>
          Browse Available Cars
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex flex-col gap-8">
        {/* Navigation */}
        <div>
          <Button 
            variant="outline" 
            className="mb-4 flex items-center gap-2"
            onClick={() => navigate("/cars")}
          >
            <ArrowLeft size={16} />
            <span>Back to Listings</span>
          </Button>
          
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{car.title}</h1>
          
          <div className="flex flex-wrap gap-3 mb-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin size={16} className="mr-1" />
              {car.location}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <User size={16} className="mr-1" />
              {owner ? (
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm text-muted-foreground" 
                  onClick={() => navigate(`/user/${owner.username}`)}
                >
                  {owner.displayName}
                </Button>
              ) : (
                "Unknown Owner"
              )}
            </div>
          </div>
        </div>

        {/* Show success message when booking is created */}
        {bookingSuccess && (
          <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Booking Request Sent!</AlertTitle>
            <AlertDescription>
              Your booking request has been sent to the owner. You can view the status in "My Bookings".
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Images and details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery */}
            {car.imageUrls && car.imageUrls.length > 0 ? (
              <ImageGallery images={car.imageUrls} />
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">No images available</p>
              </div>
            )}
            
            {/* Car specs */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Car Details</h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Make & Model</p>
                    <p className="font-medium">{car.carInfo.make} {car.carInfo.model}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Year</p>
                    <p className="font-medium">{car.carInfo.year}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Color</p>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border" 
                        style={{ backgroundColor: car.carInfo.color.toLowerCase() }}
                      ></div>
                      <p className="font-medium">{car.carInfo.color}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Transmission</p>
                    <p className="font-medium">{car.carInfo.transmission}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Fuel Type</p>
                    <p className="font-medium">{car.carInfo.fuelType}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Seats</p>
                    <p className="font-medium">{car.carInfo.seats}</p>
                  </div>
                </div>
                
                {/* Features badges */}
                <div className="mt-6">
                  <h3 className="text-base font-medium mb-3">Features</h3>
                  <div className="flex flex-wrap gap-2">
                    <FeatureBadge>
                      <Car size={14} />
                      <span>{car.carInfo.seats} seats</span>
                    </FeatureBadge>
                    
                    <FeatureBadge>
                      <Settings size={14} />
                      <span>{car.carInfo.transmission}</span>
                    </FeatureBadge>
                    
                    <FeatureBadge>
                      <Fuel size={14} />
                      <span>{car.carInfo.fuelType}</span>
                    </FeatureBadge>
                    
                    <FeatureBadge>
                      <PaintBucket size={14} />
                      <span>{car.carInfo.color}</span>
                    </FeatureBadge>
                    
                    <FeatureBadge>
                      <Calendar size={14} />
                      <span>{car.carInfo.year}</span>
                    </FeatureBadge>
                    
                    {car.features && car.features.map((feature, index) => (
                      <FeatureBadge key={index}>
                        <CircleDashed size={14} />
                        <span>{feature}</span>
                      </FeatureBadge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-muted-foreground">{car.description}</p>
                
                <Separator className="my-4" />
                
                <h3 className="text-lg font-medium mb-2">Availability</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays size={18} />
                  <span>
                    From {formatDate(car.availableFrom.toDate())} to {formatDate(car.availableTo.toDate())}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right column: Booking card */}
          <div>
            <Card className="sticky top-4">
              <CardContent className="p-6">
                {/* Replace the old booking UI with the BookingForm component */}
                {user && car.owner === user.uid ? (
                  <div className="text-center p-4 border rounded-md">
                    <p className="text-muted-foreground">
                      This is your car listing. You cannot book your own car.
                    </p>
                  </div>
                ) : (
                  <BookingForm
                    carId={car.id}
                    carTitle={car.title}
                    carImageUrl={car.imageUrls[0]}
                    ownerId={car.owner}
                    ownerName={owner?.displayName || "Car Owner"}
                    pricePerDay={car.price}
                    availableFrom={car.availableFrom.toDate()}
                    availableTo={car.availableTo.toDate()}
                    onSuccess={handleBookingSuccess}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
