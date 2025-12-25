import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Car, Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // The reset password link creates a session automatically
      if (session) {
        setIsValidSession(true);
      } else {
        // Check URL for error or access_token
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        
        if (error) {
          console.error('Reset password error:', error, errorDescription);
          setIsValidSession(false);
          toast({
            title: "Link expirat",
            description: errorDescription || "Link-ul de resetare a expirat. Vă rugăm să solicitați unul nou.",
            variant: "destructive",
          });
        } else {
          // Wait a bit for the session to be established
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            setIsValidSession(!!retrySession);
          }, 1000);
        }
      }
    };

    checkSession();

    // Listen for auth state changes (when coming from email link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: "Parolă prea scurtă",
        description: "Parola trebuie să aibă cel puțin 6 caractere.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Parolele nu coincid",
        description: "Vă rugăm să verificați că parolele introduse sunt identice.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      toast({
        title: "Eroare",
        description: error.message || "A apărut o eroare la resetarea parolei.",
        variant: "destructive",
      });
    } else {
      setIsSuccess(true);
      toast({
        title: "Parolă actualizată!",
        description: "Parola a fost schimbată cu succes.",
      });
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }

    setIsSubmitting(false);
  };

  // Loading state
  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Invalid/expired link
  if (isValidSession === false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-2">
                <Car className="h-8 w-8 text-primary" />
                <span className="text-2xl font-display font-bold text-foreground">
                  FixMyCar<span className="text-primary">.ro</span>
                </span>
              </Link>
            </div>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Link expirat sau invalid</CardTitle>
                <CardDescription>
                  Link-ul de resetare a parolei a expirat sau este invalid. Vă rugăm să solicitați un nou link.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Link to="/am-uitat-parola" className="w-full">
                    <Button className="w-full">
                      Solicită link nou
                    </Button>
                  </Link>
                  <Link to="/autentificare" className="w-full">
                    <Button variant="ghost" className="w-full">
                      Înapoi la autentificare
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <Car className="h-8 w-8 text-primary" />
              <span className="text-2xl font-display font-bold text-foreground">
                FixMyCar<span className="text-primary">.ro</span>
              </span>
            </Link>
          </div>

          <Card>
            <CardHeader className="text-center">
              {isSuccess ? (
                <>
                  <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Parolă actualizată!</CardTitle>
                  <CardDescription>
                    Parola a fost schimbată cu succes. Veți fi redirecționat...
                  </CardDescription>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Resetare parolă</CardTitle>
                  <CardDescription>
                    Introduceți noua parolă pentru contul dumneavoastră.
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent>
              {isSuccess ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Parolă nouă</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmă parola</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Se actualizează..." : "Salvează parola nouă"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
