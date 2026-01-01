import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Car, Calendar, Trash2, Bell, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';

interface ITPReminder {
  id: string;
  user_id: string;
  vin: string;
  civ: string | null;
  car_make: string | null;
  car_model: string | null;
  itp_expiry_date: string;
  reminder_sent_30_days: boolean;
  reminder_sent_7_days: boolean;
  reminder_sent_1_day: boolean;
  created_at: string;
}

const ITPRemindersManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    vin: '',
    civ: '',
    car_make: '',
    car_model: '',
    itp_expiry_date: '',
  });

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['itp-reminders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('itp_reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('itp_expiry_date', { ascending: true });
      
      if (error) throw error;
      return data as ITPReminder[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('Nu ești autentificat');
      
      const { error } = await supabase
        .from('itp_reminders')
        .insert({
          user_id: user.id,
          vin: data.vin,
          civ: data.civ || null,
          car_make: data.car_make || null,
          car_model: data.car_model || null,
          itp_expiry_date: data.itp_expiry_date,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itp-reminders'] });
      setIsDialogOpen(false);
      setFormData({ vin: '', civ: '', car_make: '', car_model: '', itp_expiry_date: '' });
      toast({
        title: 'Memento adăugat',
        description: 'Vei primi notificări înainte de expirarea ITP-ului.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Eroare',
        description: error.message || 'Nu s-a putut adăuga memento-ul.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('itp_reminders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itp-reminders'] });
      toast({
        title: 'Memento șters',
        description: 'Memento-ul a fost șters cu succes.',
      });
    },
    onError: () => {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge memento-ul.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vin || !formData.itp_expiry_date) {
      toast({
        title: 'Date incomplete',
        description: 'VIN-ul și data expirării sunt obligatorii.',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const getExpiryStatus = (expiryDate: string) => {
    const days = differenceInDays(parseISO(expiryDate), new Date());
    
    if (days < 0) {
      return { label: 'Expirat', variant: 'destructive' as const, icon: AlertTriangle, urgent: true };
    } else if (days <= 7) {
      return { label: `${days} zile`, variant: 'destructive' as const, icon: AlertTriangle, urgent: true };
    } else if (days <= 30) {
      return { label: `${days} zile`, variant: 'secondary' as const, icon: Bell, urgent: false };
    } else {
      return { label: `${days} zile`, variant: 'outline' as const, icon: CheckCircle, urgent: false };
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Mementouri ITP
            </CardTitle>
            <CardDescription>
              Primește notificări înainte de expirarea ITP-ului vehiculelor tale
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adaugă
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adaugă memento ITP</DialogTitle>
                <DialogDescription>
                  Vei primi notificări cu 30, 7 și 1 zi înainte de expirare.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="car_make">Marcă</Label>
                    <Input
                      id="car_make"
                      placeholder="ex: Volkswagen"
                      value={formData.car_make}
                      onChange={(e) => setFormData(prev => ({ ...prev, car_make: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="car_model">Model</Label>
                    <Input
                      id="car_model"
                      placeholder="ex: Golf"
                      value={formData.car_model}
                      onChange={(e) => setFormData(prev => ({ ...prev, car_model: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vin">VIN (Serie Șasiu) *</Label>
                  <Input
                    id="vin"
                    placeholder="17 caractere"
                    value={formData.vin}
                    onChange={(e) => setFormData(prev => ({ ...prev, vin: e.target.value.toUpperCase() }))}
                    maxLength={17}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="civ">CIV (Serie CI Vehicul)</Label>
                  <Input
                    id="civ"
                    placeholder="Opțional"
                    value={formData.civ}
                    onChange={(e) => setFormData(prev => ({ ...prev, civ: e.target.value.toUpperCase() }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itp_expiry_date">Data expirării ITP *</Label>
                  <Input
                    id="itp_expiry_date"
                    type="date"
                    value={formData.itp_expiry_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, itp_expiry_date: e.target.value }))}
                    required
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Anulează
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Se salvează...' : 'Salvează'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Car className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Nu ai niciun memento ITP configurat.
            </p>
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adaugă primul vehicul
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => {
              const status = getExpiryStatus(reminder.itp_expiry_date);
              const StatusIcon = status.icon;
              const carName = [reminder.car_make, reminder.car_model].filter(Boolean).join(' ') || 'Vehicul';
              
              return (
                <div
                  key={reminder.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    status.urgent ? 'border-destructive/50 bg-destructive/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                      status.urgent ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                    }`}>
                      <Car className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{carName}</p>
                      <p className="text-xs text-muted-foreground">
                        VIN: {reminder.vin.slice(-6)}... • Expiră: {format(parseISO(reminder.itp_expiry_date), 'd MMM yyyy', { locale: ro })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={status.variant} className="flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Șterge memento</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ești sigur că vrei să ștergi acest memento pentru {carName}? Nu vei mai primi notificări.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anulează</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteMutation.mutate(reminder.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Șterge
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ITPRemindersManager;
