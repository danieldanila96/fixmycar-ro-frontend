import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/components/NotificationProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import ForGarages from "./pages/ForGarages";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import Messages from "./pages/Messages";
import MyAppointments from "./pages/MyAppointments";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotificationSettings from "./pages/NotificationSettings";
import GarageRegistration from "./pages/GarageRegistration";
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
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/autentificare" element={<Auth />} />
            <Route path="/am-uitat-parola" element={<ForgotPassword />} />
            <Route path="/reseteaza-parola" element={<ResetPassword />} />
            <Route path="/cum-functioneaza" element={<HowItWorks />} />
            <Route path="/pentru-garaje" element={<ForGarages />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/termeni" element={<Terms />} />
            <Route path="/confidentialitate" element={<PrivacyPolicy />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/cauta-service" element={<SearchGarages />} />
            <Route path="/service/:garageId" element={<GaragePublicProfile />} />
            
            {/* Protected customer routes */}
            <Route path="/cerere" element={<ProtectedRoute><RequestQuote /></ProtectedRoute>} />
            <Route path="/contul-meu" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/cereri/:id" element={<ProtectedRoute><JobDetails /></ProtectedRoute>} />
            <Route path="/cereri/:jobId/recenzie" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
            <Route path="/profil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/mesaje" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/mesaje/:conversationId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/programari" element={<ProtectedRoute><MyAppointments /></ProtectedRoute>} />
            <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
            <Route path="/notificari" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
            <Route path="/inregistrare-service" element={<ProtectedRoute><GarageRegistration /></ProtectedRoute>} />
            
            {/* Protected garage routes */}
            <Route path="/service" element={<ProtectedRoute requireGarage><GarageDashboard /></ProtectedRoute>} />
            <Route path="/service/cereri/:id" element={<ProtectedRoute requireGarage><GarageJobDetails /></ProtectedRoute>} />
            
            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/kyc" element={<ProtectedRoute requireAdmin><AdminKYC /></ProtectedRoute>} />
            <Route path="/admin/utilizatori" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/cereri" element={<ProtectedRoute requireAdmin><AdminJobs /></ProtectedRoute>} />
            <Route path="/admin/recenzii" element={<ProtectedRoute requireAdmin><AdminReviews /></ProtectedRoute>} />
            
            {/* Catch-all */}
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
