import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/firebase/auth/AuthContext";
import { getCarListingsByOwner } from "@/firebase/db/services/getCarListings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, PencilLine, Trash2, Car, Calendar, MapPin, ArrowRight } from "lucide-react";
import { ListingStatus } from "@/firebase/db/model/carmodel";
import { DeleteCarDialog } from "@/components/cars/DeleteCarDialog";

// Define an interface for car listings
interface CarListing {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrls: string[];
  location: string;
  status: ListingStatus;
  carInfo: {
    make: string;
    model: string;
    year: number;
  };
  availableFrom: {
    toDate: () => Date;
  };
  availableTo: {
    toDate: () => Date;
  };
}

export function MyCarPage() {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyCars();
  }, [user]);

  async function fetchMyCars() {
    if (!user) return;

    try {
      setLoading(true);
      const carListings = await getCarListingsByOwner(user.uid);

      if (Array.isArray(carListings)) {
        setCars(carListings as CarListing[]);
      } else {
        console.error("Unexpected data format from getCarListingsByOwner");
        setError("Failed to load your cars due to data format issue.");
        setCars([]);
      }
    } catch (err) {
      console.error("Error fetching your cars:", err);
      setError("Failed to load your cars. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  const handleAddCar = () => {
    navigate("/add-car");
  };

  const handleEditCar = (carId: string) => {
    navigate(`/edit-car/${carId}`);
  };

  const handleDeleteCar = (car: CarListing) => {
    setSelectedCar(car);
    setDeleteDialogOpen(true);
  };

  const handleCarDeleted = () => {
    // Refresh the car listings after successful deletion
    fetchMyCars();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadgeVariant = (status: ListingStatus) => {
    switch (status) {
      case ListingStatus.ACTIVE:
        return "default";
      case ListingStatus.RENTED:
        return "secondary";
      case ListingStatus.MAINTENANCE:
        return "outline";
      case ListingStatus.INACTIVE:
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Car Listings</h1>
        <Button onClick={handleAddCar} className="flex items-center gap-2">
          <Plus size={16} />
          <span className="hidden xs:inline-block">Add New Car</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8 px-4 bg-destructive/10 rounded-lg border border-destructive/20">
          <p className="text-destructive font-medium mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-2">
            Try Again
          </Button>
        </div>
      ) : cars.length === 0 ? (
        <Card className="w-full py-12 border border-dashed">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="bg-muted rounded-full p-3">
              <Car size={32} className="text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">No Cars Listed Yet</h2>
            <p className="text-muted-foreground max-w-md">
              You haven't listed any cars for sharing yet. Add your first car to start earning and sharing with the community.
            </p>
            <Button onClick={handleAddCar} className="mt-2 flex items-center gap-2">
              List Your First Car
              <ArrowRight size={16} />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <Card key={car.id} className="overflow-hidden flex flex-col h-full border hover:shadow-md transition-all">
              <div className="aspect-video relative overflow-hidden bg-muted">
                {car.imageUrls && car.imageUrls.length > 0 ? (
                  <img
                    src={car.imageUrls[0]}
                    alt={car.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car size={48} className="text-muted-foreground/40" />
                  </div>
                )}
                <Badge
                  className="absolute top-2 right-2"
                  variant={getStatusBadgeVariant(car.status)}
                >
                  {car.status}
                </Badge>
              </div>

              <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold line-clamp-1">{car.title}</h3>
                  <span className="font-bold">
                    ${car.price}
                    <span className="text-sm text-muted-foreground">/day</span>
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-2">
                  {car.carInfo.make} {car.carInfo.model} ({car.carInfo.year})
                </p>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow">
                  {car.description}
                </p>

                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <MapPin size={14} className="mr-1 flex-shrink-0" />
                  <span className="truncate">{car.location}</span>
                </div>

                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar size={14} className="mr-1 flex-shrink-0" />
                  {car.availableFrom && car.availableTo && (
                    <span className="truncate">
                      {formatDate(car.availableFrom.toDate())} - {formatDate(car.availableTo.toDate())}
                    </span>
                  )}
                </div>

                <CardFooter className="p-0 pt-4 mt-auto flex justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 flex-1"
                    onClick={() => handleEditCar(car.id)}
                  >
                    <PencilLine size={14} />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 flex-1 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCar(car)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </Button>
                </CardFooter>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedCar && (
        <DeleteCarDialog
          carId={selectedCar.id}
          carTitle={selectedCar.title}
          isOpen={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onDeleted={handleCarDeleted}
        />
      )}
    </div>
  );
}