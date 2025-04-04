import { AddCarForm } from "@/components/cars/AddCarForm";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AddCarPage() {
  const navigate = useNavigate();
  
  const handleSuccess = () => {
    navigate("/cars");
  };
  
  const handleCancel = () => {
    navigate("/cars");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate("/cars")}
          className="shrink-0"
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Add Your Car</h1>
      </div>
      <AddCarForm onSubmit={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
