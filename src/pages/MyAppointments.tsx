import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { CalendarIcon, Clock, Building2, Loader2, Trash2 } from 'lucide-react';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  notes: string | null;
  status: string;
  created_at: string;
  garage_id: string;
}

interface GarageProfile {
  business_name: string | null;
  city: string | null;
  county: string | null;
}

const SERVICE_TYPES: Record<string, string> = {
  revizie: 'Revizie & Întreținere',
  mecanica: 'Mecanică generală',
  electrica: 'Electrică auto',
  caroserie: 'Tinichigerie & Vopsitorie',
  diagnoza: 'Diagnoză computerizată',
  clima: 'Aer condiționat',
  frane: 'Sistem de frânare',
  suspensie: 'Suspensie & Direcție',
  itp: 'Pregătire ITP',
  altele: 'Altele',
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'În așteptare', variant: 'secondary' },
  confirmed: { label: 'Confirmată', variant: 'default' },
  cancelled: { label: 'Anulată', variant: 'destructive' },
  completed: { label: 'Finalizată', variant: 'outline' },
};

const MyAppointments = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/autentificare');
    }
  }, [user, authLoading, navigate]);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['my-appointments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('customer_id', user.id)
        .order('appointment_date', { ascending: true });
      
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!user,
  });

  const { data: garages } = useQuery({
    queryKey: ['appointment-garages', appointments?.map(a => a.garage_id)],
    queryFn: async () => {
      if (!appointments?.length) return {};
      
      const garageIds = [...new Set(appointments.map(a => a.garage_id))];
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, business_name, city, county')
        .in('user_id', garageIds);
      
      if (error) throw error;
      
      const garageMap: Record<string, GarageProfile> = {};
      data?.forEach(g => {
        garageMap[g.user_id] = g;
      });
      return garageMap;
    },
    enabled: !!appointments?.length,
  });

  const cancelAppointment = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      toast.success('Programare anulată');
    },
    onError: () => {
      toast.error('Eroare la anularea programării');
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  // Get today's date in YYYY-MM-DD format for reliable comparison
  const today = new Date().toISOString().split('T')[0];

  const upcomingAppointments = appointments?.filter(a => 
    a.status !== 'cancelled' && a.status !== 'completed' && 
    a.appointment_date >= today
  ) || [];

  const pastAppointments = appointments?.filter(a => 
    a.status === 'completed' || a.status === 'cancelled' ||
    a.appointment_date < today
  ) || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20 pb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Programările Mele</h1>

          {/* Upcoming Appointments */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Programări viitoare</h2>
            {upcomingAppointments.length > 0 ? (
              <div className="grid gap-4">
                {upcomingAppointments.map((appointment) => {
                  const garage = garages?.[appointment.garage_id];
                  const statusConfig = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.pending;
                  
                  return (
                    <Card key={appointment.id}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-primary" />
                              <span className="font-semibold">
                                {garage?.business_name || 'Service auto'}
                              </span>
                              <Badge variant={statusConfig.variant}>
                                {statusConfig.label}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4" />
                                {format(new Date(appointment.appointment_date), 'EEEE, d MMMM yyyy', { locale: ro })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {appointment.appointment_time}
                              </span>
                            </div>
                            
                            <p className="text-sm">
                              <span className="font-medium">Serviciu:</span>{' '}
                              {SERVICE_TYPES[appointment.service_type] || appointment.service_type}
                            </p>
                            
                            {appointment.notes && (
                              <p className="text-sm text-muted-foreground">
                                Note: {appointment.notes}
                              </p>
                            )}
                          </div>

                          {appointment.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelAppointment.mutate(appointment.id)}
                              disabled={cancelAppointment.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Anulează
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nu ai programări viitoare.</p>
                  <Button className="mt-4" onClick={() => navigate('/cauta-service')}>
                    Găsește un service
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Past Appointments */}
          {pastAppointments.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Istoric programări</h2>
              <div className="grid gap-4">
                {pastAppointments.map((appointment) => {
                  const garage = garages?.[appointment.garage_id];
                  const statusConfig = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.pending;
                  
                  return (
                    <Card key={appointment.id} className="opacity-75">
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {garage?.business_name || 'Service auto'}
                              </span>
                              <Badge variant={statusConfig.variant}>
                                {statusConfig.label}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4" />
                                {format(new Date(appointment.appointment_date), 'd MMMM yyyy', { locale: ro })}
                              </span>
                              <span>{appointment.appointment_time}</span>
                            </div>
                            
                            <p className="text-sm">
                              {SERVICE_TYPES[appointment.service_type] || appointment.service_type}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyAppointments;
