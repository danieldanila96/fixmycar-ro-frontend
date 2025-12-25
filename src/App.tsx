import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/components/NotificationProvider";
import Index from "./pages/Index";
import RequestQuote from "./pages/RequestQuote";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import JobDetails from "./pages/JobDetails";
import GarageDashboard from "./pages/GarageDashboard";
import GarageJobDetails from "./pages/GarageJobDetails";
import GaragePublicProfile from "./pages/GaragePublicProfile";
import SearchGarages from "./pages/SearchGarages";
import ReviewPage from "./pages/ReviewPage";
import Profile from "./pages/Profile";
import HowItWorks from "./pages/HowItWorks";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Messages from "./pages/Messages";
import MyAppointments from "./pages/MyAppointments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/cerere" element={<RequestQuote />} />
            <Route path="/autentificare" element={<Auth />} />
            <Route path="/contul-meu" element={<Dashboard />} />
            <Route path="/cereri/:id" element={<JobDetails />} />
            <Route path="/cereri/:jobId/recenzie" element={<ReviewPage />} />
            <Route path="/service" element={<GarageDashboard />} />
            <Route path="/service/cereri/:id" element={<GarageJobDetails />} />
            <Route path="/service/:garageId" element={<GaragePublicProfile />} />
            <Route path="/cauta-service" element={<SearchGarages />} />
            <Route path="/profil" element={<Profile />} />
            <Route path="/cum-functioneaza" element={<HowItWorks />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/termeni" element={<Terms />} />
            <Route path="/mesaje" element={<Messages />} />
            <Route path="/mesaje/:conversationId" element={<Messages />} />
            <Route path="/programari" element={<MyAppointments />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
