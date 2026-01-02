import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, Calendar, MessageSquare, FileCheck, Car, Loader2, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  email_new_quotes: boolean;
  email_quote_accepted: boolean;
  email_booking_confirmation: boolean;
  email_appointment_reminders: boolean;
  email_itp_reminders: boolean;
  email_kyc_updates: boolean;
  email_messages: boolean;
}

const defaultPreferences: NotificationPreferences = {
  email_new_quotes: true,
  email_quote_accepted: true,
  email_booking_confirmation: true,
  email_appointment_reminders: true,
  email_itp_reminders: true,
  email_kyc_updates: true,
  email_messages: true,
};

const NotificationSettings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/autentificare');
    }
  }, [user, authLoading, navigate]);

  const { data: savedPreferences, isLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (savedPreferences) {
      setPreferences({
        email_new_quotes: savedPreferences.email_new_quotes,
        email_quote_accepted: savedPreferences.email_quote_accepted,
        email_booking_confirmation: savedPreferences.email_booking_confirmation,
        email_appointment_reminders: savedPreferences.email_appointment_reminders,
        email_itp_reminders: savedPreferences.email_itp_reminders,
        email_kyc_updates: savedPreferences.email_kyc_updates,
        email_messages: savedPreferences.email_messages,
      });
    }
  }, [savedPreferences]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      if (savedPreferences) {
        const { error } = await supabase
          .from('notification_preferences')
          .update(preferences)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user.id, ...preferences });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      setHasChanges(false);
      toast({
        title: 'Preferințe salvate!',
        description: 'Setările de notificare au fost actualizate.',
      });
    },
    onError: () => {
      toast({
        title: 'Eroare',
        description: 'Nu am putut salva preferințele. Încercați din nou.',
        variant: 'destructive',
      });
    },
  });

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const notificationGroups = [
    {
      title: 'Oferte și Rezervări',
      icon: Car,
      items: [
        {
          key: 'email_new_quotes' as const,
          label: 'Oferte noi',
          description: 'Primește email când un service trimite o ofertă pentru cererea ta',
        },
        {
          key: 'email_quote_accepted' as const,
          label: 'Ofertă acceptată',
          description: 'Notificare când un client acceptă oferta ta (pentru service-uri)',
        },
        {
          key: 'email_booking_confirmation' as const,
          label: 'Confirmare rezervare',
          description: 'Email de confirmare când rezervarea este finalizată',
        },
      ],
    },
    {
      title: 'Programări și Remindere',
      icon: Calendar,
      items: [
        {
          key: 'email_appointment_reminders' as const,
          label: 'Remindere programări',
          description: 'Primește reminder cu o zi înainte de programare',
        },
        {
          key: 'email_itp_reminders' as const,
          label: 'Remindere ITP',
          description: 'Notificări înainte de expirarea ITP-ului vehiculului',
        },
      ],
    },
    {
      title: 'Comunicare',
      icon: MessageSquare,
      items: [
        {
          key: 'email_messages' as const,
          label: 'Mesaje noi',
          description: 'Primește email când primești un mesaj nou',
        },
      ],
    },
    {
      title: 'Cont și Verificare',
      icon: FileCheck,
      items: [
        {
          key: 'email_kyc_updates' as const,
          label: 'Actualizări verificare KYC',
          description: 'Notificări despre statusul verificării contului (pentru service-uri)',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-20 md:pt-24">
        <div className="container max-w-2xl py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Setări Notificări
            </h1>
            <p className="text-muted-foreground mt-1">
              Alege ce tipuri de notificări email dorești să primești
            </p>
          </div>

          <div className="space-y-6">
            {notificationGroups.map((group) => (
              <Card key={group.title}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <group.icon className="h-5 w-5 text-primary" />
                    {group.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {group.items.map((item, index) => (
                    <div key={item.key}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <Label htmlFor={item.key} className="text-base font-medium cursor-pointer">
                            {item.label}
                          </Label>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {item.description}
                          </p>
                        </div>
                        <Switch
                          id={item.key}
                          checked={preferences[item.key]}
                          onCheckedChange={(checked) => updatePreference(item.key, checked)}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!hasChanges || saveMutation.isPending}
                className="flex-1"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Se salvează...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvează preferințele
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/contul-meu')}
              >
                Înapoi
              </Button>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Despre notificările email</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Notificările importante despre securitatea contului și tranzacții vor fi 
                      trimise întotdeauna, indiferent de aceste setări.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotificationSettings;
