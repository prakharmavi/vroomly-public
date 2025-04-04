import { useState } from "react";
import { format, differenceInDays, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { DollarSign, CalendarIcon, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/firebase/auth/AuthContext";
import { createBooking } from "@/firebase/db/services/bookingService";
import { BookingStatus } from "@/firebase/db/model/bookingmodel";
import { useNavigate } from "react-router-dom";

interface BookingFormProps {
  carId: string;
  carTitle: string;
  carImageUrl: string;
  ownerId: string;
  ownerName: string;
  pricePerDay: number;
  availableFrom: Date;
  availableTo: Date;
  onSuccess?: () => void;
}

export function BookingForm({
  carId,
  carTitle,
  carImageUrl,
  ownerId,
  ownerName,
  pricePerDay,
  availableFrom,
  availableTo,
  onSuccess
}: BookingFormProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [endDate, setEndDate] = useState<Date | undefined>(addDays(new Date(), 3));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  // Calculate total price
  const days = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;
  const serviceFee = 10; // Fixed service fee
  const totalPrice = days * pricePerDay + serviceFee;

  const handleSubmit = async () => {
    if (!user) {
      navigate("/auth", { state: { from: `/cars/${carId}` } });
      return;
    }

    if (!startDate || !endDate) {
      setError("Please select both start and end dates for your booking");
      return;
    }

    if (startDate > endDate) {
      setError("End date cannot be before start date");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const bookingData = {
        carId,
        carTitle,
        carImageUrl,
        renterId: user.uid,
        renterName: user.displayName || 'Anonymous',
        renterProfileImage: user.photoURL || undefined,
        ownerId,
        ownerName,
        startDate,
        endDate,
        totalPrice,
        status: BookingStatus.PENDING,
        notes: notes.trim() || undefined
      };

      const result = await createBooking(bookingData, user);

      if (!result.success) {
        throw new Error(result.error || "Failed to create booking");
      }

      // Success! Notify parent component or redirect
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/my-bookings");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <DollarSign size={24} className="text-primary" />
          <span className="text-3xl font-bold">{pricePerDay}</span>
          <span className="text-lg text-muted-foreground">/day</span>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Rental Period</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">From</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${!startDate && "text-muted-foreground"}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => 
                      date < new Date() || 
                      date < availableFrom || 
                      date > availableTo
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">To</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline" 
                    className={`w-full justify-start text-left font-normal ${!endDate && "text-muted-foreground"}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => 
                      date < new Date() || 
                      (startDate && date < startDate) ||
                      date < availableFrom || 
                      date > availableTo
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Notes (optional)</label>
          <Textarea 
            placeholder="Any special requests or questions for the car owner?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px]"
            maxLength={500}
          />
        </div>
      </div>
      
      <div className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Price per day</span>
          <span>${pricePerDay}</span>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Days</span>
          <span>{days}</span>
        </div>
        
        <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
          <span>Service fee</span>
          <span>${serviceFee}</span>
        </div>
        
        <Separator className="my-3" />
        
        <div className="flex items-center justify-between font-bold">
          <span>Total</span>
          <span>${totalPrice}</span>
        </div>
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Button 
        className="w-full" 
        size="lg"
        onClick={handleSubmit}
        disabled={loading || !startDate || !endDate}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Request Booking"
        )}
      </Button>
      
      <div className="text-center text-sm text-muted-foreground">
        <p>You won't be charged until the owner accepts your booking</p>
      </div>
    </div>
  );
}
