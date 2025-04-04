import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/ui/navbar";
import { AuthProvider } from "@/firebase/auth/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthPage } from "@/pages/AuthPage";
import { HomePage } from "@/pages/HomePage";
import { MyCarPage } from "@/pages/MyCarPage";
import { EditCarPage } from "@/pages/EditCarPage";
import { CarListingsPage } from "@/pages/CarListingsPage";
import { AddCarPage } from "@/pages/AddCarPage";
import { CarDetailPage } from "@/pages/CarDetailPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ViewPublicProfilePage } from "./pages/ViewPublicProfilePage";
import { Footer } from "@/components/ui/footer";
import { MessagesPage } from "./pages/MessagesPage";
import { useEffect } from 'react';
import { populateCarDataToFirestore } from '@/firebase/db/services/carMakeModelService';
import { Toaster } from "@/components/ui/toaster";
import { MessageNotifier } from "@/components/notifications/MessageNotifier";
import { MyBookingsPage } from "./pages/MyBookingsPage";

function App() {
  // Initialize car data in Firestore when the app starts
  useEffect(() => {
    const initializeCarData = async () => {
      try {
        await populateCarDataToFirestore();
        console.log('Car data successfully loaded into Firestore');
      } catch (err) {
        console.warn('Car data may already be populated:', err);
      }
    };
    
    initializeCarData();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="system" storageKey="sharecar-theme">
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/cars" element={<CarListingsPage />} />
                <Route path="/cars/:id" element={<CarDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/user/:username" element={<ViewPublicProfilePage />} />
                <Route path="/add-car" element={
                  <ProtectedRoute>
                    <AddCarPage />
                  </ProtectedRoute>
                } />
                <Route path="/my-cars" element={
                  <ProtectedRoute>
                    <MyCarPage />
                  </ProtectedRoute>
                } />
                <Route path="/edit-car/:id" element={
                  <ProtectedRoute>
                    <EditCarPage />
                  </ProtectedRoute>
                } />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/messages/:conversationId" element={<MessagesPage />} />
                <Route path="/messages/user/:username" element={<MessagesPage />} />
                <Route path="/my-bookings" element={
                  <ProtectedRoute>
                    <MyBookingsPage />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
            <Toaster />
            <MessageNotifier />
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
