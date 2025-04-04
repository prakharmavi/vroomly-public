import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/firebase/auth/AuthContext";
import { getCarListingById } from "@/firebase/db/services/getCarListings";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditCarForm } from "@/components/cars/EditCarForm";

// Define an interface for the car data based on what we're expecting
interface CarData {
  id: string;
  owner?: string;
  [key: string]: string | number | boolean | object | null | undefined; // Allow common property types
}

export function EditCarPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [carData, setCarData] = useState<CarData | null>(null);
  
  useEffect(() => {
    async function verifyAccess() {
      if (!id || !user) {
        setLoading(false);
        return;
      }
      
      try {
        const data = await getCarListingById(id) as CarData;
        setCarData(data);
        
        if (data) {
          // Instead of accessing .owner directly, check if it exists first
          if (data && 'owner' in data && data.owner === user.uid) {
            setAuthorized(true);
          } else {
            console.log("Owner mismatch or not found:", { 
              userId: user.uid,
              dataKeys: Object.keys(data)
            });
          }
        }
      } catch (err) {
        console.error("Error verifying access:", err);
      } finally {
        setLoading(false);
      }
    }
    
    verifyAccess();
  }, [id, user]);

  const handleEditSuccess = () => {
    navigate("/my-cars");
  };

  const handleCancel = () => {
    navigate("/my-cars");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="text-center py-8 px-4">
        <h2 className="text-xl md:text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          You don't have permission to access this page.
        </p>
        <Button onClick={() => navigate("/my-cars")}>
          Back to My Cars
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 px-2 sm:px-0">
      <div className="flex items-center gap-2 mb-2">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate("/my-cars")}
          className="shrink-0"
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Edit Car Listing</h1>
      </div>
      
      {id && carData && (
        <EditCarForm 
          carId={id}
          initialData={carData}
          onSubmit={handleEditSuccess}
          onCancel={handleCancel}
          isLoading={loading}
        />
      )}
    </div>
  );
}