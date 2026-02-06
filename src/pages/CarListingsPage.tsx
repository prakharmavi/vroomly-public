import { useState, useEffect } from "react";
import { useAuth } from "@/firebase/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Loader2, MapPin, ChevronLeft, ChevronRight, Calendar, Car } from "lucide-react";
import { getAvailableCarListings } from "@/firebase/db/services/getCarListings";
import { FuelType, TransmissionType } from "@/firebase/db/model/carmodel";

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
  features: string[];
  availableFrom: Date;
  availableTo: Date;
}

// Card component to display individual car listings
const CarListingCard = ({ listing, onViewDetails }: { 
  listing: CarListing; 
  onViewDetails: (id: string) => void 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (listing.imageUrls.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % listing.imageUrls.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (listing.imageUrls.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + listing.imageUrls.length) % listing.imageUrls.length);
    }
  };

  return (
    <div 
      className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow flex flex-col h-full"
      onClick={() => onViewDetails(listing.id)}
    >
      <div className="relative">
        {/* Image carousel */}
        <img 
          src={listing.imageUrls[currentImageIndex]} 
          alt={listing.title} 
          className="w-full h-48 object-cover transition-opacity"
        />
        
        {/* Price tag */}
        <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white px-3 py-1 rounded-tl-md font-bold">
          ${listing.price}/day
        </div>
        
        {/* Navigation arrows (only show if multiple images) */}
        {listing.imageUrls.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70 transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70 transition-all"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
            
            {/* Image indicator dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {listing.imageUrls.map((_, index) => (
                <div 
                  key={index} 
                  className={`w-1.5 h-1.5 rounded-full ${
                    currentImageIndex === index ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      <div className="p-5 md:p-6 space-y-4 flex-grow flex flex-col">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold line-clamp-1">{listing.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {listing.carInfo.make} {listing.carInfo.model} ({listing.carInfo.year})
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3 mb-2">
          <span className="bg-muted px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
            <Car size={12} />
            {listing.carInfo.seats} seats
          </span>
          <span className="bg-muted px-3 py-1 rounded-full text-xs">
            {listing.carInfo.transmission}
          </span>
          <span className="bg-muted px-3 py-1 rounded-full text-xs">
            {listing.carInfo.fuelType}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 flex-grow">{listing.description}</p>
        
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <MapPin size={16} className="mr-2 flex-shrink-0" />
          <span className="truncate">{listing.location}</span>
        </div>
        
        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar size={14} className="mr-1 flex-shrink-0" />
          <span>Available: {new Date(listing.availableFrom).toLocaleDateString()} - {new Date(listing.availableTo).toLocaleDateString()}</span>
        </div>
        
        <Button 
          className="w-full mt-2" 
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(listing.id);
          }}
        >
          View Details
        </Button>
      </div>
    </div>
  );
};

// Empty state component
const EmptyState = ({ onAddCar }: { onAddCar: () => void }) => (
  <div className="text-center py-12 px-4 bg-muted/30 rounded-lg border border-dashed">
    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
      <Car size={24} className="text-muted-foreground" />
    </div>
    <h3 className="text-lg font-medium mb-2">No cars available</h3>
    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
      There are no cars available for rent at the moment. Be the first to share your car!
    </p>
    <Button onClick={onAddCar} className="flex items-center gap-2">
      <PlusCircle size={16} />
      List Your Car
    </Button>
  </div>
);

// Main component
export function CarListingsPage() {
  const [listings, setListings] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCarListings() {
      try {
        setLoading(true);
        setError(null);
        
        const fetchedListings = await getAvailableCarListings();
        
        if (Array.isArray(fetchedListings)) {
          // Process the data to ensure dates are properly handled
          const processedListings = fetchedListings.map(listing => ({
            ...listing,
            availableFrom: listing.availableFrom instanceof Date 
              ? listing.availableFrom 
              : new Date(listing.availableFrom),
            availableTo: listing.availableTo instanceof Date 
              ? listing.availableTo 
              : new Date(listing.availableTo),
            // Ensure imageUrls is always an array, fallback to empty array
            imageUrls: listing.imageUrls || []
          }));
          
          setListings(processedListings as CarListing[]);
        } else {
          console.error("Unexpected data format from getAvailableCarListings");
          setError("Failed to load car listings due to data format issue.");
          setListings([]);
        }
      } catch (err) {
        console.error("Error fetching car listings:", err);
        setError("Failed to load car listings. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchCarListings();
  }, []);

  const handleAddCar = () => {
    if (user) {
      navigate("/add-car");
    } else {
      navigate("/auth", { state: { from: "/add-car" } });
    }
  };

  const handleViewDetails = (id: string) => {
    navigate(`/cars/${id}`);
  };

  return (
    <div className="container-standard mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div className="flex justify-between items-center mb-8 md:mb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Available Cars</h1>
          <p className="text-muted-foreground mt-2 text-base md:text-lg">Find and rent the perfect car for your needs</p>
        </div>
        <Button onClick={handleAddCar} className="flex items-center gap-2">
          <PlusCircle size={16} />
          <span className="hidden xs:inline-block">List Your Car</span>
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading available cars...</p>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {!loading && error && (
        <div className="text-center py-8 px-4 bg-destructive/10 rounded-lg border border-destructive/20">
          <p className="text-destructive font-medium mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-2">
            Try Again
          </Button>
        </div>
      )}
      
      {/* Results */}
      {!loading && !error && (
        <>
          {/* Filter/sort controls can be added here in the future */}
          
          {/* Car listing grid */}
          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {listings.map((listing) => (
                <CarListingCard 
                  key={listing.id} 
                  listing={listing} 
                  onViewDetails={handleViewDetails} 
                />
              ))}
            </div>
          ) : (
            <EmptyState onAddCar={handleAddCar} />
          )}
        </>
      )}
    </div>
  );
}
