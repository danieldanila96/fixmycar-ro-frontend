import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireGarage?: boolean;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  requireGarage = false,
  requireAdmin = false 
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  // Check user type (garage vs customer)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile-type', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user && (requireGarage || requireAuth),
  });

  // Check admin role
  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ['user-admin-check', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc('is_admin', { _user_id: user.id });
      if (error) throw error;
      return data;
    },
    enabled: !!user && requireAdmin,
  });

  // Show loading while checking auth state
  const isLoading = authLoading || (requireAuth && profileLoading) || (requireAdmin && adminLoading);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if authentication is required but user is not logged in
  if (requireAuth && !user) {
    return <Navigate to="/autentificare" state={{ from: location.pathname }} replace />;
  }

  // Redirect non-garage users trying to access garage routes
  if (requireGarage && profile?.user_type !== 'garage') {
    return <Navigate to="/contul-meu" replace />;
  }

  // Redirect non-admin users trying to access admin routes
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
