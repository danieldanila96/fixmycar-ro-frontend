import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useState } from 'react';
import { CalendarIcon, Clock, User, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  customer_id: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  notes: string | null;
  status: string;
  created_at: string;
}

interface CustomerProfile {
  full_name: string | null;
  phone: string | null;
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

const GarageAppointments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['garage-appointments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('garage_id', user.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });
      
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!user,
  });

  const { data: customers } = useQuery({
    queryKey: ['appointment-customers', appointments?.map(a => a.customer_id)],
    queryFn: async () => {
      if (!appointments?.length) return {};
      
      const customerIds = [...new Set(appointments.map(a => a.customer_id))];
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', customerIds);
      
      if (error) throw error;
      
      const customerMap: Record<string, CustomerProfile> = {};
      data?.forEach(c => {
        customerMap[c.user_id] = c;
      });
      return customerMap;
    },
    enabled: !!appointments?.length,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garage-appointments'] });
      toast.success('Programare actualizată');
    },
    onError: () => {
      toast.error('Eroare la actualizarea programării');
    },
  });

  // Get dates that have appointments for calendar highlighting
  const appointmentDates = appointments?.map(a => new Date(a.appointment_date)) || [];

  // Filter appointments for selected date
  const selectedDateAppointments = appointments?.filter(a => 
    isSameDay(new Date(a.appointment_date), selectedDate)
  ) || [];

  // Get pending appointments count
  const pendingCount = appointments?.filter(a => a.status === 'pending').length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Programări</h2>
        {pendingCount > 0 && (
          <Badge variant="secondary">
            {pendingCount} în așteptare
          </Badge>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ro}
              modifiers={{
                hasAppointment: appointmentDates,
              }}
              modifiersStyles={{
                hasAppointment: {
                  fontWeight: 'bold',
                  backgroundColor: 'hsl(var(--primary) / 0.1)',
                  borderRadius: '100%',
                },
              }}
              className={cn("p-0 pointer-events-auto")}
            />
          </CardContent>
        </Card>

        {/* Appointments for selected date */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: ro })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateAppointments.length > 0 ? (
              <div className="space-y-4">
                {selectedDateAppointments.map((appointment) => {
                  const customer = customers?.[appointment.customer_id];
                  const statusConfig = STATUS_CONFIG[appointment.status];
                  
                  return (
                    <div
                      key={appointment.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 font-semibold">
                            <Clock className="h-4 w-4 text-primary" />
                            {appointment.appointment_time}
                          </div>
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        
                        {appointment.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateStatus.mutate({ id: appointment.id, status: 'confirmed' })}
                              disabled={updateStatus.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Confirmă
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus.mutate({ id: appointment.id, status: 'cancelled' })}
                              disabled={updateStatus.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Refuză
                            </Button>
                          </div>
                        )}
                        
                        {appointment.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus.mutate({ id: appointment.id, status: 'completed' })}
                            disabled={updateStatus.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Finalizează
                          </Button>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{customer?.full_name || 'Client'}</span>
                        </div>
                        {customer?.phone && (
                          <div className="text-muted-foreground">
                            📞 {customer.phone}
                          </div>
                        )}
                      </div>

                      <div className="text-sm">
                        <span className="font-medium">Serviciu: </span>
                        {SERVICE_TYPES[appointment.service_type] || appointment.service_type}
                      </div>

                      {appointment.notes && (
                        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nu ai programări pentru această zi.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GarageAppointments;
