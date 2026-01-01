import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/components/NotificationProvider";
import CookieConsent from "@/components/CookieConsent";
import Index from "./pages/Index";
import RequestQuote from "./pages/RequestQuote";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
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
import CookiePolicy from "./pages/CookiePolicy";
import Messages from "./pages/Messages";
import MyAppointments from "./pages/MyAppointments";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminJobs from "./pages/admin/AdminJobs";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminKYC from "./pages/admin/AdminKYC";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NotificationProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/cerere" element={<RequestQuote />} />
            <Route path="/autentificare" element={<Auth />} />
            <Route path="/am-uitat-parola" element={<ForgotPassword />} />
            <Route path="/reseteaza-parola" element={<ResetPassword />} />
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
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/mesaje" element={<Messages />} />
            <Route path="/mesaje/:conversationId" element={<Messages />} />
            <Route path="/programari" element={<MyAppointments />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/kyc" element={<AdminKYC />} />
            <Route path="/admin/utilizatori" element={<AdminUsers />} />
            <Route path="/admin/cereri" element={<AdminJobs />} />
            <Route path="/admin/recenzii" element={<AdminReviews />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsent />
          </NotificationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
