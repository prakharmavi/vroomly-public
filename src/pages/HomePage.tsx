import { useNavigate } from "react-router-dom";
import { useAuth } from "@/firebase/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Car, Users, Calendar, ArrowRight } from "lucide-react";

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero section */}
      <section className="relative flex-1 flex items-center justify-center border-b">
        <div className="container-standard mx-auto px-4 md:px-6 py-20 md:py-32">
          <div className="flex flex-col items-center justify-center text-center mx-auto max-w-3xl">
            <h1 className="text-5xl font-bold tracking-tight lg:text-6xl mb-8">
              Find Your Perfect Ride
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-16 max-w-2xl leading-relaxed">
              Rent cars from local owners or share your vehicle to earn extra income
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center w-full max-w-md gap-4">
              <Button 
                className="flex-1 h-12 text-base font-medium" 
                onClick={() => navigate('/cars')}
              >
                Browse Cars
                <Search className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline" 
                className="flex-1 h-12 text-base font-medium"
                onClick={() => navigate(user ? '/add-car' : '/auth')}
              >
                List Your Car
                <Car className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container-standard mx-auto px-4 md:px-6">
          <div className="grid gap-10 md:gap-14 md:grid-cols-3">
            <Card className="relative overflow-hidden">
              <CardContent className="pt-8 px-6 pb-6">
                <div className="mb-6 p-3 w-fit rounded-lg bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Verified Community</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Every user is verified with ID checks and driving history review
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardContent className="pt-8 px-6 pb-6">
                <div className="mb-6 p-3 w-fit rounded-lg bg-primary/10">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Flexible Rentals</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Book by the day, week, or month with transparent pricing
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardContent className="pt-8 px-6 pb-6">
                <div className="mb-6 p-3 w-fit rounded-lg bg-primary/10">
                  <Car className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Quality Vehicles</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Wide selection of well-maintained cars for every need
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-20 md:py-32 bg-background border-t">
        <div className="container-standard mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-8 max-w-xl mx-auto">
            <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground">
              Join our community of car sharers and find your perfect ride today
            </p>
            <Button 
              size="lg"  
              onClick={() => navigate(user ? '/cars' : '/auth')}
              className="h-12 px-8 text-base font-medium"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
