import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Star, CheckCircle, Car } from 'lucide-react';
import StarRating from '@/components/StarRating';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Selectează un rating').max(5),
  comment: z.string().max(1000, 'Comentariul nu poate depăși 1000 de caractere').optional(),
});

interface Job {
  id: string;
  category: string;
  car_make: string;
  car_model: string;
  car_year: number | null;
  status: string;
  user_id: string;
}

interface AcceptedQuote {
  id: string;
  garage_id: string;
  price: number;
  garage: {
    business_name: string | null;
    full_name: string | null;
  } | null;
}

const ReviewPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/autentificare');
    }
  }, [user, authLoading, navigate]);

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['review-job', jobId],
    queryFn: async () => {
      if (!jobId) throw new Error('No job ID');

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data as Job;
    },
    enabled: !!jobId && !!user,
  });

  const { data: acceptedQuote } = useQuery({
    queryKey: ['accepted-quote', jobId],
    queryFn: async () => {
      if (!jobId) return null;

      const { data: quoteData, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('job_id', jobId)
        .eq('status', 'accepted')
        .single();

      if (error || !quoteData) return null;

      // Fetch garage profile
      const { data: garageData } = await supabase
        .from('profiles')
        .select('business_name, full_name')
        .eq('user_id', quoteData.garage_id)
        .single();

      return {
        ...quoteData,
        garage: garageData,
      } as AcceptedQuote;
    },
    enabled: !!jobId && !!user,
  });

  const { data: existingReview } = useQuery({
    queryKey: ['existing-review', jobId],
    queryFn: async () => {
      if (!jobId) return null;

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('job_id', jobId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!jobId && !!user,
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!user || !jobId || !acceptedQuote) throw new Error('Missing data');

      const validation = reviewSchema.safeParse({ rating, comment });
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
          job_id: jobId,
          customer_id: user.id,
          garage_id: acceptedQuote.garage_id,
          rating,
          comment: comment.trim() || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['existing-review', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      setIsSubmitted(true);
      toast({
        title: 'Mulțumim pentru recenzie!',
        description: 'Recenzia ta a fost publicată cu succes.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Eroare',
        description: error.message || 'Nu am putut salva recenzia. Încercați din nou.',
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

  // Check if user owns this job
  if (job.user_id !== user.id) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-20 md:pt-24">
          <div className="container max-w-2xl py-8">
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Nu aveți permisiunea de a lăsa o recenzie pentru această cerere.</p>
                <Button className="mt-4" onClick={() => navigate('/contul-meu')}>
                  Înapoi la cereri
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Check if job is completed
  if (job.status !== 'completed') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-20 md:pt-24">
          <div className="container max-w-2xl py-8">
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Puteți lăsa o recenzie doar după finalizarea lucrării.
                </p>
                <Button className="mt-4" onClick={() => navigate(`/cereri/${jobId}`)}>
                  Înapoi la cerere
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Already reviewed
  if (existingReview || isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-20 md:pt-24">
          <div className="container max-w-2xl py-8">
            <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Mulțumim pentru recenzie!</h2>
                <p className="text-muted-foreground mb-6">
                  Recenzia ta ajută alți clienți să găsească service-uri de încredere.
                </p>
                <div className="flex justify-center mb-6">
                  <StarRating rating={existingReview?.rating || rating} size="lg" className="gap-2" />
                </div>
                {(existingReview?.comment || comment) && (
                  <p className="text-sm text-muted-foreground italic mb-6">
                    "{existingReview?.comment || comment}"
                  </p>
                )}
                <Button onClick={() => navigate('/contul-meu')}>
                  Înapoi la cererile mele
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const garageName = acceptedQuote?.garage?.business_name || acceptedQuote?.garage?.full_name || 'Service Auto';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-20 md:pt-24">
        <div className="container max-w-2xl py-8">
          {/* Back Button */}
          <Link
            to={`/cereri/${jobId}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi la cerere
          </Link>

          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Lasă o recenzie</CardTitle>
              <CardDescription>
                Spune-ne cum a fost experiența ta cu <strong>{garageName}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Job Info */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Car className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{job.car_make} {job.car_model}</p>
                  <p className="text-sm text-muted-foreground">{job.category}</p>
                </div>
              </div>

              {/* Star Rating */}
              <div className="space-y-3">
                <Label className="text-base">Cum evaluezi serviciul primit? *</Label>
                <div className="flex justify-center">
                  <StarRating
                    rating={rating}
                    size="lg"
                    interactive
                    onChange={setRating}
                    className="gap-2"
                  />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {rating === 0 && 'Selectează un rating'}
                  {rating === 1 && 'Foarte slab'}
                  {rating === 2 && 'Slab'}
                  {rating === 3 && 'Acceptabil'}
                  {rating === 4 && 'Bun'}
                  {rating === 5 && 'Excelent'}
                </p>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label htmlFor="comment">Comentariu (opțional)</Label>
                <Textarea
                  id="comment"
                  placeholder="Descrie experiența ta: calitatea lucrărilor, profesionalismul echipei, raportul calitate-preț..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right">{comment.length}/1000</p>
              </div>

              {/* Submit */}
              <Button
                className="w-full"
                onClick={() => submitReviewMutation.mutate()}
                disabled={rating === 0 || submitReviewMutation.isPending}
              >
                {submitReviewMutation.isPending ? 'Se trimite...' : 'Trimite recenzia'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Recenzia ta va fi publică și va ajuta alți clienți să aleagă un service de încredere.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReviewPage;
