import { useState, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format, addDays, isBefore, startOfToday } from 'date-fns';
import { ro } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

interface OperatingHours {
  [key: string]: DaySchedule;
}

const SERVICE_TYPES = [
  { value: 'revizie', label: 'Revizie & Întreținere' },
  { value: 'mecanica', label: 'Mecanică generală' },
  { value: 'electrica', label: 'Electrică auto' },
  { value: 'caroserie', label: 'Tinichigerie & Vopsitorie' },
  { value: 'diagnoza', label: 'Diagnoză computerizată' },
  { value: 'clima', label: 'Aer condiționat' },
  { value: 'frane', label: 'Sistem de frânare' },
  { value: 'suspensie', label: 'Suspensie & Direcție' },
  { value: 'itp', label: 'Pregătire ITP' },
  { value: 'altele', label: 'Altele' },
];

const ALL_TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
];

interface AppointmentBookingProps {
  garageId: string;
  garageName: string;
}

const AppointmentBooking = ({ garageId, garageName }: AppointmentBookingProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [serviceType, setServiceType] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Fetch garage operating hours
  const { data: garageProfile } = useQuery({
    queryKey: ['garage-profile', garageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('operating_hours')
        .eq('user_id', garageId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const operatingHours = garageProfile?.operating_hours as unknown as OperatingHours | null;

  // Get available time slots based on selected date and operating hours
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) {
      return ALL_TIME_SLOTS.slice(4, 24); // Default 08:00 - 18:00
    }

    if (!operatingHours) {
      // Default schedule if no operating hours set
      if (selectedDate.getDay() === 0) return []; // Sunday closed
      if (selectedDate.getDay() === 6) return ALL_TIME_SLOTS.slice(6, 16); // Saturday 09:00 - 14:00
      return ALL_TIME_SLOTS.slice(4, 24); // Weekdays 08:00 - 18:00
    }

    const dayOfWeek = selectedDate.getDay().toString();
    const daySchedule = operatingHours[dayOfWeek];

    if (!daySchedule || daySchedule.closed) {
      return [];
    }

    const openTime = daySchedule.open || '08:00';
    const closeTime = daySchedule.close || '18:00';

    return ALL_TIME_SLOTS.filter((time) => {
      return time >= openTime && time < closeTime;
    });
  }, [selectedDate, operatingHours]);

  // Check if a date is closed
  const isDateClosed = (date: Date) => {
    if (!operatingHours) {
      return date.getDay() === 0; // Default: closed on Sunday
    }
    const dayOfWeek = date.getDay().toString();
    const daySchedule = operatingHours[dayOfWeek];
    return daySchedule?.closed === true;
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfToday()) || isDateClosed(date);
  };

  const createAppointment = useMutation({
    mutationFn: async () => {
      if (!user || !selectedDate || !selectedTime || !serviceType) {
        throw new Error('Date incomplete');
      }

      const { data, error } = await supabase.from('appointments').insert({
        customer_id: user.id,
        garage_id: garageId,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: selectedTime,
        service_type: serviceType,
        notes: notes || null,
      }).select().single();

      if (error) throw error;

      // Send email notification
      try {
        await supabase.functions.invoke('send-appointment-email', {
          body: { appointmentId: data.id, type: 'new' },
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Programare creată cu succes! Vei primi un email de confirmare.');
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Eroare la crearea programării');
    },
  });

  const resetForm = () => {
    setSelectedDate(undefined);
    setSelectedTime('');
    setServiceType('');
    setNotes('');
  };

  const handleSubmit = () => {
    if (!user) {
      toast.error('Trebuie să fii autentificat pentru a face o programare');
      return;
    }
    if (!selectedDate || !selectedTime || !serviceType) {
      toast.error('Te rog completează toate câmpurile obligatorii');
      return;
    }
    if (availableTimeSlots.length === 0) {
      toast.error('Service-ul este închis în ziua selectată');
      return;
    }
    createAppointment.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <CalendarIcon className="mr-2 h-4 w-4" />
          Programează-te
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Programare la {garageName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Selectează data *</Label>
            <div className="border rounded-lg p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedTime(''); // Reset time when date changes
                }}
                disabled={isDateDisabled}
                locale={ro}
                fromDate={startOfToday()}
                toDate={addDays(new Date(), 60)}
                className={cn("p-0 pointer-events-auto")}
              />
            </div>
            {selectedDate && (
              <p className="text-sm text-muted-foreground">
                Data selectată: {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: ro })}
              </p>
            )}
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Selectează ora *</Label>
            {availableTimeSlots.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {availableTimeSlots.map((time) => (
                  <Button
                    key={time}
                    type="button"
                    variant={selectedTime === time ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTime(time)}
                    className="text-xs"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {selectedDate ? 'Service-ul este închis în această zi' : 'Selectează mai întâi o dată'}
              </p>
            )}
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label>Tipul serviciului *</Label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger>
                <SelectValue placeholder="Selectează serviciul" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Detalii suplimentare (opțional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descrie problema sau serviciul dorit..."
              rows={3}
            />
          </div>

          {/* Summary */}
          {selectedDate && selectedTime && serviceType && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-2">Rezumat programare:</h4>
                <div className="text-sm space-y-1">
                  <p>📅 {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: ro })}</p>
                  <p>🕐 Ora: {selectedTime}</p>
                  <p>🔧 {SERVICE_TYPES.find(t => t.value === serviceType)?.label}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedTime || !serviceType || createAppointment.isPending}
            className="w-full"
          >
            {createAppointment.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se creează...
              </>
            ) : (
              'Confirmă programarea'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentBooking;
