import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home, Car } from "lucide-react";

export function NotFoundPage() {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <h1 className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-4">404</h1>
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Page Not Found</h2>
      <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex flex-col xs:flex-row gap-3">
        <Button 
          onClick={() => navigate("/")}
          variant="default"
          className="flex items-center gap-2"
        >
          <Home size={16} />
          Go Home
        </Button>
        <Button 
          onClick={() => navigate("/cars")}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Car size={16} />
          Browse Cars
        </Button>
      </div>
    </div>
  );
}
