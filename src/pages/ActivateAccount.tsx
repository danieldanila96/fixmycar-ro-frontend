import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SEO from '@/components/SEO';

type ActivationState = 'loading' | 'success' | 'error' | 'already_confirmed';

const ActivateAccount = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<ActivationState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const handleActivation = async () => {
      // Check for token_hash and type in URL (Supabase email confirmation format)
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Handle error from Supabase
      if (error) {
        setState('error');
        setErrorMessage(errorDescription || 'A apărut o eroare la activarea contului.');
        return;
      }

      // If we have token_hash and type, verify the OTP
      if (tokenHash && type) {
        try {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'signup' | 'email',
          });

          if (verifyError) {
            if (verifyError.message.includes('already confirmed') || 
                verifyError.message.includes('expired')) {
              setState('already_confirmed');
            } else {
              setState('error');
              setErrorMessage(verifyError.message);
            }
            return;
          }

          setState('success');
        } catch (err) {
          setState('error');
          setErrorMessage('A apărut o eroare neașteptată.');
        }
        return;
      }

      // Check if user is already logged in (came from email link that auto-confirmed)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setState('success');
        return;
      }

      // No token and not logged in - show waiting state or error
      setState('error');
      setErrorMessage('Link invalid sau expirat. Încearcă să te înregistrezi din nou.');
    };

    handleActivation();
  }, [searchParams]);

  // Countdown and redirect on success
  useEffect(() => {
    if (state === 'success' || state === 'already_confirmed') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/autentificare');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [state, navigate]);

  const handleGoToLogin = () => {
    navigate('/autentificare');
  };

  const handleGoToRegister = () => {
    navigate('/autentificare');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title="Activare Cont | FixMyCar"
        description="Activează-ți contul FixMyCar pentru a începe să folosești platforma."
      />
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            {state === 'loading' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Loader2 className="h-16 w-16 text-primary animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                  Se activează contul...
                </h1>
                <p className="text-muted-foreground">
                  Te rugăm să aștepți câteva secunde.
                </p>
              </div>
            )}

            {state === 'success' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-4">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                  Cont activat cu succes!
                </h1>
                <p className="text-muted-foreground">
                  Felicitări! Contul tău a fost activat. Acum te poți autentifica.
                </p>
                <p className="text-sm text-muted-foreground">
                  Vei fi redirecționat în {countdown} secunde...
                </p>
                <Button onClick={handleGoToLogin} className="w-full mt-4">
                  Mergi la Autentificare
                </Button>
              </div>
            )}

            {state === 'already_confirmed' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-blue-100 p-4">
                    <Mail className="h-12 w-12 text-blue-600" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                  Cont deja activat
                </h1>
                <p className="text-muted-foreground">
                  Contul tău este deja activat. Te poți autentifica folosind datele tale.
                </p>
                <p className="text-sm text-muted-foreground">
                  Vei fi redirecționat în {countdown} secunde...
                </p>
                <Button onClick={handleGoToLogin} className="w-full mt-4">
                  Mergi la Autentificare
                </Button>
              </div>
            )}

            {state === 'error' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-red-100 p-4">
                    <XCircle className="h-12 w-12 text-red-600" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                  Eroare la activare
                </h1>
                <p className="text-muted-foreground">
                  {errorMessage || 'A apărut o eroare la activarea contului.'}
                </p>
                <div className="space-y-2 mt-4">
                  <Button onClick={handleGoToRegister} className="w-full">
                    Încearcă din nou
                  </Button>
                  <Button onClick={handleGoToLogin} variant="outline" className="w-full">
                    Mergi la Autentificare
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default ActivateAccount;
