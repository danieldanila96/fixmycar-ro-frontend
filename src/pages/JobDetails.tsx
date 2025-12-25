import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Car, MapPin, Calendar, Clock, Star, Phone, CheckCircle, MessageSquare, ThumbsUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type JobStatus = 'open' | 'quotes_provided' | 'booked' | 'completed' | 'cancelled';
type QuoteStatus = 'sent' | 'accepted' | 'rejected';

interface Quote {
  id: string;
  price: number;
  message: string | null;
  estimated_days: number | null;
  status: QuoteStatus;
  created_at: string;
  garage_id: string;
  garage: {
    id: string;
    business_name: string | null;
    full_name: string | null;
    phone: string | null;
    average_rating: number;
    total_reviews: number;
    city: string | null;
  } | null;
}

interface Job {
  id: string;
  category: string;
  car_make: string;
  car_model: string;
  car_year: number | null;
  fuel_type: string | null;
  description: string;
  city: string;
  county: string;
  urgency: string | null;
  status: JobStatus;
  created_at: string;
  needed_by: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

const statusConfig: Record<JobStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Deschisă', variant: 'default' },
  quotes_provided: { label: 'Oferte primite', variant: 'secondary' },
  booked: { label: 'Programată', variant: 'outline' },
  completed: { label: 'Finalizată', variant: 'outline' },
  cancelled: { label: 'Anulată', variant: 'destructive' },
};

const JobDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/autentificare');
    }
  }, [user, authLoading, navigate]);

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', id],
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

  const { data: quotes, isLoading: quotesLoading } = useQuery({
    queryKey: ['job-quotes', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data: quotesData, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('job_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch garage profiles separately
      const quotesWithGarages = await Promise.all(
        (quotesData || []).map(async (quote) => {
          const { data: garageData } = await supabase
            .from('profiles')
            .select('id, business_name, full_name, phone, average_rating, total_reviews, city')
            .eq('user_id', quote.garage_id)
            .single();

          return {
            ...quote,
            garage: garageData
          };
        })
      );

      return quotesWithGarages as Quote[];
    },
    enabled: !!id && !!user,
  });

  const { data: existingReview } = useQuery({
    queryKey: ['job-review', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('job_id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Review | null;
    },
    enabled: !!id && !!user,
  });

  const acceptQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      // Update the selected quote to accepted
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ status: 'accepted' })
        .eq('id', quoteId);

      if (quoteError) throw quoteError;

      // Reject all other quotes for this job
      const { error: rejectError } = await supabase
        .from('quotes')
        .update({ status: 'rejected' })
        .eq('job_id', id)
        .neq('id', quoteId);

      if (rejectError) throw rejectError;

      // Update job status
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ status: 'booked' })
        .eq('id', id);

      if (jobError) throw jobError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['job-quotes', id] });
      toast({
        title: 'Ofertă acceptată!',
        description: 'Service-ul va fi notificat și vă va contacta pentru programare.',
      });
    },
    onError: () => {
      toast({
        title: 'Eroare',
        description: 'Nu am putut accepta oferta. Încercați din nou.',
        variant: 'destructive',
      });
    },
  });

  const markCompletedMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['user-jobs'] });
      toast({
        title: 'Lucrare finalizată!',
        description: 'Poți acum lăsa o recenzie pentru service.',
      });
    },
    onError: () => {
      toast({
        title: 'Eroare',
        description: 'Nu am putut actualiza statusul. Încercați din nou.',
        variant: 'destructive',
      });
    },
  });

  const startConversationMutation = useMutation({
    mutationFn: async (garageId: string) => {
      if (!user || !id) throw new Error('Nu ești autentificat');
      
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('job_id', id)
        .eq('garage_id', garageId)
        .maybeSingle();

      if (existing) {
        return existing.id;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          job_id: id,
          customer_id: user.id,
          garage_id: garageId,
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

  const status = statusConfig[job.status];
  const acceptedQuote = quotes?.find(q => q.status === 'accepted');
  const pendingQuotes = quotes?.filter(q => q.status === 'sent') || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 md:pt-24">
        <div className="container py-8">
          {/* Back Button */}
          <Link 
            to="/contul-meu" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi la cereri
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Job Details */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Detalii cerere</CardTitle>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                      <Car className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{job.car_make} {job.car_model}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.car_year && `${job.car_year} • `}{job.fuel_type || 'Combustibil nespecificat'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Categorie</p>
                    <p>{job.category}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Descriere problemă</p>
                    <p className="text-sm">{job.description}</p>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{job.city}, {job.county}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Creată pe {formatDate(job.created_at)}</span>
                  </div>

                  {job.urgency && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Urgență: {job.urgency}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              {job.status === 'booked' && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      Lucrarea a fost finalizată? Marchează ca finalizată pentru a putea lăsa o recenzie.
                    </p>
                    <Button 
                      className="w-full" 
                      onClick={() => markCompletedMutation.mutate()}
                      disabled={markCompletedMutation.isPending}
                    >
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      {markCompletedMutation.isPending ? 'Se procesează...' : 'Marchează ca finalizată'}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {job.status === 'completed' && !existingReview && (
                <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="h-5 w-5 text-amber-500" />
                      <p className="font-medium">Lasă o recenzie</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Spune-ne cum a fost experiența ta cu service-ul.
                    </p>
                    <Button 
                      className="w-full" 
                      variant="default"
                      onClick={() => navigate(`/cereri/${id}/recenzie`)}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Scrie o recenzie
                    </Button>
                  </CardContent>
                </Card>
              )}

              {existingReview && (
                <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <p className="font-medium text-green-700 dark:text-green-300">Recenzie publicată</p>
                    </div>
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= existingReview.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    {existingReview.comment && (
                      <p className="text-sm text-muted-foreground italic">"{existingReview.comment}"</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quotes Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  Oferte primite ({quotes?.length || 0})
                </h2>
              </div>

              {quotesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : quotes && quotes.length > 0 ? (
                <div className="space-y-4">
                  {/* Accepted Quote */}
                  {acceptedQuote && (
                    <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                              <CardTitle className="text-base">
                                {acceptedQuote.garage?.business_name || acceptedQuote.garage?.full_name || 'Service Auto'}
                              </CardTitle>
                              <CardDescription>Ofertă acceptată</CardDescription>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">{acceptedQuote.price} Lei</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {acceptedQuote.message && (
                          <p className="text-sm mb-4">{acceptedQuote.message}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm">
                          {acceptedQuote.garage?.phone && (
                            <a href={`tel:${acceptedQuote.garage.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                              <Phone className="h-4 w-4" />
                              {acceptedQuote.garage.phone}
                            </a>
                          )}
                          {acceptedQuote.garage?.city && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {acceptedQuote.garage.city}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Pending Quotes */}
                  {pendingQuotes.map((quote) => (
                    <Card key={quote.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">
                              {quote.garage?.business_name || quote.garage?.full_name || 'Service Auto'}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              {quote.garage?.average_rating ? (
                                <span className="flex items-center gap-1 text-sm">
                                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                  {quote.garage.average_rating} ({quote.garage.total_reviews} recenzii)
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">Fără recenzii încă</span>
                              )}
                              {quote.garage?.city && (
                                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {quote.garage.city}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{quote.price} Lei</p>
                            {quote.estimated_days && (
                              <p className="text-sm text-muted-foreground">
                                ~{quote.estimated_days} {quote.estimated_days === 1 ? 'zi' : 'zile'}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {quote.message && (
                          <p className="text-sm text-muted-foreground mb-4">{quote.message}</p>
                        )}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            Primită pe {formatDate(quote.created_at)}
                          </span>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => startConversationMutation.mutate(quote.garage_id)}
                              disabled={startConversationMutation.isPending}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Mesaj
                            </Button>
                            {(job.status === 'open' || job.status === 'quotes_provided') && (
                              <Button 
                                onClick={() => acceptQuoteMutation.mutate(quote.id)}
                                disabled={acceptQuoteMutation.isPending}
                              >
                                {acceptQuoteMutation.isPending ? 'Se procesează...' : 'Acceptă oferta'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Rejected quotes info */}
                  {quotes.filter(q => q.status === 'rejected').length > 0 && (
                    <p className="text-sm text-muted-foreground text-center pt-4">
                      {quotes.filter(q => q.status === 'rejected').length} oferte au fost refuzate automat după acceptarea uneia.
                    </p>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nicio ofertă încă</h3>
                    <p className="text-muted-foreground">
                      Cererea ta a fost trimisă către service-urile din zona ta. 
                      Vei primi oferte în curând.
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

export default JobDetails;
