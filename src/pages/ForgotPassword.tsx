import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Car, ArrowLeft, Mail, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast({
        title: "Email invalid",
        description: "Vă rugăm să introduceți o adresă de email validă.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reseteaza-parola`,
    });

    if (error) {
      toast({
        title: "Eroare",
        description: "A apărut o eroare. Vă rugăm să încercați din nou.",
        variant: "destructive",
      });
    } else {
      setEmailSent(true);
      toast({
        title: "Email trimis!",
        description: "Verificați inbox-ul pentru link-ul de resetare.",
      });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link to="/autentificare" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Înapoi la autentificare
        </Link>
      </header>

      {/* Main Content */}
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
              {emailSent ? (
                <>
                  <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Verificați email-ul</CardTitle>
                  <CardDescription>
                    Am trimis un link de resetare a parolei la adresa <strong>{email}</strong>
                  </CardDescription>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Ați uitat parola?</CardTitle>
                  <CardDescription>
                    Introduceți adresa de email și vă vom trimite un link pentru a reseta parola.
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent>
              {emailSent ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Nu ați primit email-ul? Verificați folderul spam sau încercați din nou.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEmailSent(false)}
                      className="w-full"
                    >
                      Trimite din nou
                    </Button>
                    <Link to="/autentificare" className="w-full">
                      <Button variant="ghost" className="w-full">
                        Înapoi la autentificare
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplu.ro"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Se trimite..." : "Trimite link de resetare"}
                  </Button>

                  <p className="text-sm text-center text-muted-foreground">
                    Vă amintiți parola?{' '}
                    <Link to="/autentificare" className="text-primary hover:underline">
                      Autentificați-vă
                    </Link>
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
