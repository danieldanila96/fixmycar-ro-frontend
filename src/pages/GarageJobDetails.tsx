import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Car, MapPin, Calendar, Clock, Send, CheckCircle, MessageSquare } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const quoteSchema = z.object({
  price: z.number().min(1, 'Prețul trebuie să fie mai mare de 0').max(999999, 'Preț prea mare'),
  message: z.string().max(1000, 'Mesajul nu poate depăși 1000 de caractere').optional(),
  estimated_days: z.number().min(1).max(365).optional(),
});

interface Job {
  id: string;
  user_id: string;
  category: string;
  car_make: string;
  car_model: string;
  car_year: number | null;
  fuel_type: string | null;
  description: string;
  city: string;
  county: string;
  urgency: string | null;
  status: string;
  created_at: string;
  needed_by: string | null;
  images: string[] | null;
}

interface ExistingQuote {
  id: string;
  price: number;
  message: string | null;
  estimated_days: number | null;
  status: string;
  created_at: string;
}

const GarageJobDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/autentificare');
    }
  }, [user, authLoading, navigate]);

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['garage-job', id],
    queryFn: async () => {
      if (!id) throw new Error('No job ID');

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Job;
    },
    enabled: !!id && !!user,
  });

  const { data: existingQuote, isLoading: quoteLoading } = useQuery({
    queryKey: ['my-quote', id, user?.id],
    queryFn: async () => {
      if (!id || !user) return null;

      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('job_id', id)
        .eq('garage_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ExistingQuote | null;
    },
    enabled: !!id && !!user,
  });

  const submitQuoteMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error('Missing data');

      const priceNum = parseFloat(price);
      const daysNum = estimatedDays ? parseInt(estimatedDays) : undefined;

      // Validate with zod
      const validation = quoteSchema.safeParse({
        price: priceNum,
        message: message || undefined,
        estimated_days: daysNum,
      });

      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.errors.forEach(err => {
          fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
        throw new Error('Validation failed');
      }

      setErrors({});

      const { data: newQuote, error } = await supabase
        .from('quotes')
        .insert({
          job_id: id,
          garage_id: user.id,
          price: priceNum,
          message: message.trim() || null,
          estimated_days: daysNum || null,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Update job status if this is the first quote
      await supabase
        .from('jobs')
        .update({ status: 'quotes_provided' })
        .eq('id', id)
        .eq('status', 'open');

      // Send email notification to customer (non-blocking)
      supabase.functions.invoke('send-quote-notification', {
        body: {
          quoteId: newQuote.id,
          jobId: id,
          garageId: user.id,
          price: priceNum,
          estimatedDays: daysNum,
          message: message.trim() || undefined,
        },
      }).catch(err => console.error('Failed to send quote notification:', err));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-quote', id] });
      queryClient.invalidateQueries({ queryKey: ['available-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['my-quotes'] });
      toast({
        title: 'Ofertă trimisă!',
        description: 'Clientul va fi notificat și va putea accepta oferta ta.',
      });
    },
    onError: (error) => {
      if (error.message !== 'Validation failed') {
        toast({
          title: 'Eroare',
          description: 'Nu am putut trimite oferta. Încercați din nou.',
          variant: 'destructive',
        });
      }
    },
  });

  const startConversationMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id || !job) throw new Error('Nu ești autentificat');
      
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('job_id', id)
        .eq('garage_id', user.id)
        .maybeSingle();

      if (existing) {
        return existing.id;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          job_id: id,
          customer_id: job.user_id,
          garage_id: user.id,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: (conversationId) => {
      navigate(`/mesaje/${conversationId}`);
    },
    onError: () => {
      toast({
        title: 'Eroare',
        description: 'Nu am putut iniția conversația.',
        variant: 'destructive',
      });
    },
  });

  if (authLoading || jobLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !job) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const urgencyLabels: Record<string, string> = {
    urgent: 'Urgent',
    normal: 'Normal',
    flexibil: 'Flexibil',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!price || parseFloat(price) <= 0) {
      setErrors({ price: 'Introduceți un preț valid' });
      return;
    }

    submitQuoteMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-20 md:pt-24">
        <div className="container py-8">
          {/* Back Button */}
          <Link
            to="/service"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi la cereri
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Job Details */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                        <Car className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle>
                          {job.car_make} {job.car_model} {job.car_year && `(${job.car_year})`}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          {job.category}
                          {job.fuel_type && <span>• {job.fuel_type}</span>}
                        </CardDescription>
                      </div>
                    </div>
                    {job.urgency && (
                      <Badge variant={job.urgency === 'urgent' ? 'destructive' : 'outline'}>
                        {urgencyLabels[job.urgency] || job.urgency}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Descrierea problemei</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                  </div>

                  {job.images && job.images.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Poze atașate</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {job.images.map((img, index) => (
                          <a
                            key={index}
                            href={img}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block aspect-video overflow-hidden rounded-lg border hover:opacity-90 transition-opacity"
                          >
                            <img
                              src={img}
                              alt={`Poză ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{job.city}, {job.county}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Postată pe {formatDate(job.created_at)}</span>
                    </div>
                    {job.needed_by && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Necesară până la {formatDate(job.needed_by)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quote Form / Existing Quote */}
            <div className="lg:col-span-1">
              {quoteLoading ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </CardContent>
                </Card>
              ) : existingQuote ? (
                <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-lg">Ofertă trimisă</CardTitle>
                    </div>
                    <CardDescription>
                      Ai trimis deja o ofertă pentru această cerere
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Preț oferit</p>
                      <p className="text-2xl font-bold text-green-600">{existingQuote.price} Lei</p>
                    </div>
                    {existingQuote.estimated_days && (
                      <div>
                        <p className="text-sm text-muted-foreground">Timp estimat</p>
                        <p className="font-medium">
                          {existingQuote.estimated_days} {existingQuote.estimated_days === 1 ? 'zi' : 'zile'}
                        </p>
                      </div>
                    )}
                    {existingQuote.message && (
                      <div>
                        <p className="text-sm text-muted-foreground">Mesaj</p>
                        <p className="text-sm">{existingQuote.message}</p>
                      </div>
                    )}
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={existingQuote.status === 'accepted' ? 'default' : existingQuote.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {existingQuote.status === 'accepted' ? 'Acceptată' : existingQuote.status === 'rejected' ? 'Refuzată' : 'În așteptare'}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => startConversationMutation.mutate()}
                      disabled={startConversationMutation.isPending}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {startConversationMutation.isPending ? 'Se încarcă...' : 'Trimite mesaj clientului'}
                    </Button>
                  </CardContent>
                </Card>
              ) : job.status === 'open' || job.status === 'quotes_provided' ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Trimite ofertă</CardTitle>
                    <CardDescription>
                      Completează detaliile ofertei tale pentru client
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Preț (Lei) *</Label>
                        <Input
                          id="price"
                          type="number"
                          placeholder="ex: 500"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          min="1"
                          max="999999"
                          required
                        />
                        {errors.price && (
                          <p className="text-sm text-destructive">{errors.price}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="estimated-days">Timp estimat (zile)</Label>
                        <Input
                          id="estimated-days"
                          type="number"
                          placeholder="ex: 3"
                          value={estimatedDays}
                          onChange={(e) => setEstimatedDays(e.target.value)}
                          min="1"
                          max="365"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Mesaj pentru client</Label>
                        <Textarea
                          id="message"
                          placeholder="Descrieți ce include oferta, disponibilitate, etc."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          maxLength={1000}
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                          {message.length}/1000
                        </p>
                        {errors.message && (
                          <p className="text-sm text-destructive">{errors.message}</p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={submitQuoteMutation.isPending}
                      >
                        {submitQuoteMutation.isPending ? (
                          'Se trimite...'
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Trimite oferta
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      Această cerere nu mai acceptă oferte.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GarageJobDetails;
