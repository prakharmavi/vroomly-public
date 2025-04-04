import { useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Booking, BookingStatus } from "@/firebase/db/model/bookingmodel";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  updateBookingStatus 
} from "@/firebase/db/services/bookingService";
import { useAuth } from "@/firebase/auth/AuthContext";
import { 
  Calendar, 
  Car, 
  User, 
  MessageSquare, 
  Loader2, 
  CheckCircle, 
  XCircle 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { StartConversationButton } from "@/components/messaging/StartConversationButton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BookingListProps {
  bookings: Booking[];
  isOwner?: boolean;
  onStatusUpdate?: () => void;
}

export function BookingList({ bookings, isOwner = false, onStatusUpdate }: BookingListProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [updating, setUpdating] = useState(false);
  const [reason, setReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  
  if (bookings.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">
          {isOwner 
            ? "You don't have any booking requests yet." 
            : "You haven't made any bookings yet."
          }
        </p>
      </div>
    );
  }

  const handleStatusUpdate = async (bookingId: string, newStatus: BookingStatus) => {
    if (!user) return;
    
    setUpdating(true);
    setError("");
    
    try {
      const result = await updateBookingStatus(
        bookingId, 
        newStatus, 
        user, 
        newStatus === BookingStatus.REJECTED ? reason : undefined
      );
      
      if (!result.success) {
        throw new Error(result.error || "Failed to update booking status");
      }
      
      // Close dialogs
      setShowRejectDialog(false);
      setShowDetailDialog(false);
      
      // Notify parent component to refresh
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
    } finally {
      setUpdating(false);
      setReason("");
    }
  };

  const handleViewCar = (carId: string) => {
    navigate(`/cars/${carId}`);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, "MMM d, yyyy");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Image section */}
              <div className="relative h-40 md:h-full bg-muted overflow-hidden">
                {booking.carImageUrl ? (
                  <img 
                    src={booking.carImageUrl} 
                    alt={booking.carTitle} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Car size={40} className="text-muted-foreground opacity-40" />
                  </div>
                )}
              </div>
              
              {/* Info section */}
              <div className="p-4 md:col-span-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                  <h3 className="font-medium text-lg">{booking.carTitle}</h3>
                  <BookingStatusBadge status={booking.status} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-muted-foreground" />
                      <span>
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      {isOwner ? (
                        <>
                          <User size={14} className="text-muted-foreground" />
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={booking.renterProfileImage} />
                              <AvatarFallback>{getInitials(booking.renterName)}</AvatarFallback>
                            </Avatar>
                            <span>{booking.renterName}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <User size={14} className="text-muted-foreground" />
                          <span>Owned by {booking.ownerName}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="font-medium">
                      Total: ${booking.totalPrice}
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-end gap-2 mt-auto">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewCar(booking.carId)}
                    >
                      <Car size={14} className="mr-1" />
                      View Car
                    </Button>
                    
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowDetailDialog(true);
                      }}
                    >
                      Details
                    </Button>
                    
                    {isOwner && booking.status === BookingStatus.PENDING && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleStatusUpdate(booking.id, BookingStatus.APPROVED)}
                        disabled={updating}
                      >
                        {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle size={14} className="mr-1" />}
                        Approve
                      </Button>
                    )}
                    
                    {isOwner && booking.status === BookingStatus.PENDING && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowRejectDialog(true);
                        }}
                        disabled={updating}
                      >
                        <XCircle size={14} className="mr-1" />
                        Reject
                      </Button>
                    )}
                    
                    {!isOwner && booking.status === BookingStatus.PENDING && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleStatusUpdate(booking.id, BookingStatus.CANCELED)}
                        disabled={updating}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Rejection Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Booking Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this booking? Please provide a reason for the rejection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <Textarea
            placeholder="Reason for rejection (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-2"
          />
          
          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedBooking) {
                  handleStatusUpdate(selectedBooking.id, BookingStatus.REJECTED);
                }
              }}
              disabled={updating}
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Booking"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Booking Details Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        {selectedBooking && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>
                Information about this booking request
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Car</h4>
                <p>{selectedBooking.carTitle}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Dates</h4>
                <p>
                  {formatDate(selectedBooking.startDate)} - {formatDate(selectedBooking.endDate)}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Status</h4>
                <BookingStatusBadge status={selectedBooking.status} />
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Price</h4>
                <p className="font-medium">${selectedBooking.totalPrice}</p>
              </div>
              
              {selectedBooking.notes && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedBooking.notes}</p>
                </div>
              )}
              
              {selectedBooking.cancellationReason && (
                <div>
                  <h4 className="text-sm font-medium mb-1 text-red-500">Rejection/Cancellation Reason</h4>
                  <p className="text-sm text-muted-foreground">{selectedBooking.cancellationReason}</p>
                </div>
              )}
              
              <Separator />
              
              {isOwner ? (
                <div>
                  <h4 className="text-sm font-medium mb-2">Booked By</h4>
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={selectedBooking.renterProfileImage} />
                      <AvatarFallback>{getInitials(selectedBooking.renterName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedBooking.renterName}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <StartConversationButton 
                      targetUserId={selectedBooking.renterId} 
                      className="w-full"
                    >
                      <MessageSquare size={14} className="mr-1" />
                      Message Renter
                    </StartConversationButton>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="text-sm font-medium mb-2">Car Owner</h4>
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>{getInitials(selectedBooking.ownerName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedBooking.ownerName}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <StartConversationButton 
                      targetUserId={selectedBooking.ownerId} 
                      className="w-full"
                    >
                      <MessageSquare size={14} className="mr-1" />
                      Message Owner
                    </StartConversationButton>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
