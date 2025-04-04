import { useState, useEffect } from "react";
import { useAuth } from "@/firebase/auth/AuthContext";
import { Booking } from "@/firebase/db/model/bookingmodel";
import { 
  getBookingsByRenter, 
  getBookingsByOwner 
} from "@/firebase/db/services/bookingService";
import { BookingList } from "@/components/bookings/BookingList";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function MyBookingsPage() {
  const [rentalBookings, setRentalBookings] = useState<Booking[]>([]);
  const [receivedBookings, setReceivedBookings] = useState<Booking[]>([]);
  const [loadingRental, setLoadingRental] = useState(true);
  const [loadingReceived, setLoadingReceived] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      setError("");
      
      // Fetch bookings where the user is the renter
      setLoadingRental(true);
      const rentals = await getBookingsByRenter(user.uid);
      setRentalBookings(rentals);
      setLoadingRental(false);
      
      // Fetch bookings where the user is the car owner
      setLoadingReceived(true);
      const received = await getBookingsByOwner(user.uid);
      setReceivedBookings(received);
      setLoadingReceived(false);
    } catch (err) {
      console.error("Booking fetch error:", err);
      
      let errorMessage = "Failed to load bookings. Please try again.";
      
      // Check for Firebase index error
      if (err instanceof Error && err.message.includes("index")) {
        errorMessage += " The database needs configuration. Please contact support.";
        // For admins/developers, log the link to create the index
        console.info("Index creation link:", err.message);
      } else {
        errorMessage += ` Error: ${err}`;
      }
      
      setError(errorMessage);
      setLoadingRental(false);
      setLoadingReceived(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">My Bookings</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="rental" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="rental">Cars I'm Renting</TabsTrigger>
          <TabsTrigger value="received">Booking Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rental">
          {loadingRental ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <BookingList 
              bookings={rentalBookings}
              onStatusUpdate={fetchBookings}
            />
          )}
        </TabsContent>
        
        <TabsContent value="received">
          {loadingReceived ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <BookingList 
              bookings={receivedBookings}
              isOwner={true}
              onStatusUpdate={fetchBookings}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
