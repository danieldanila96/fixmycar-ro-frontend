import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');
  const quoteId = searchParams.get('quote_id');
  const jobId = searchParams.get('job_id');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/autentificare');
      return;
    }

    if (!sessionId || !quoteId || !jobId) {
      setError('Parametri de plată lipsă');
      setVerifying(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('verify-booking-payment', {
          body: { sessionId, quoteId, jobId },
        });

        if (fnError) {
          throw new Error(fnError.message);
        }

        if (data?.success) {
          setVerified(true);
          toast({
            title: 'Plată confirmată!',
            description: 'Rezervarea ta a fost confirmată cu succes.',
          });
        } else {
          throw new Error(data?.error || 'Verificarea plății a eșuat');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setError(err instanceof Error ? err.message : 'Eroare la verificarea plății');
        toast({
          title: 'Eroare',
          description: 'Nu am putut verifica plata. Te rugăm să ne contactezi.',
          variant: 'destructive',
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, quoteId, jobId, user, authLoading, navigate, toast]);

  if (authLoading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Se verifică plata...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 md:pt-24 flex items-center justify-center">
        <div className="container max-w-md py-8">
          <Card className={error ? 'border-destructive' : 'border-green-500'}>
            <CardHeader className="text-center">
              {verified ? (
                <>
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <CardTitle className="text-2xl text-green-700">Plată reușită!</CardTitle>
                </>
              ) : (
                <CardTitle className="text-2xl text-destructive">Eroare la verificare</CardTitle>
              )}
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {verified ? (
                <>
                  <p className="text-muted-foreground">
                    Mulțumim pentru plată! Rezervarea ta a fost confirmată și service-ul va fi notificat.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Vei primi o confirmare pe email cu detaliile programării.
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  {error || 'A apărut o eroare la verificarea plății.'}
                </p>
              )}
              
              <div className="flex flex-col gap-2 pt-4">
                {jobId && (
                  <Button onClick={() => navigate(`/cereri/${jobId}`)}>
                    Vezi detalii cerere
                  </Button>
                )}
                <Button variant="outline" onClick={() => navigate('/contul-meu')}>
                  Înapoi la contul meu
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;
