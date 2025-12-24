import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Car, Wrench, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<'customer' | 'garage'>('customer');
  
  // Garage specific fields
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const re = /^[0-9]{10}$/;
    return re.test(phone.replace(/\s/g, ''));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(loginEmail)) {
      toast({
        title: "Email invalid",
        description: "Vă rugăm să introduceți o adresă de email validă.",
        variant: "destructive",
      });
      return;
    }

    if (loginPassword.length < 6) {
      toast({
        title: "Parolă invalidă",
        description: "Parola trebuie să aibă cel puțin 6 caractere.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await signIn(loginEmail, loginPassword);
    
    if (error) {
      let message = "A apărut o eroare la autentificare.";
      if (error.message.includes("Invalid login credentials")) {
        message = "Email sau parolă incorectă.";
      } else if (error.message.includes("Email not confirmed")) {
        message = "Vă rugăm să confirmați adresa de email.";
      }
      
      toast({
        title: "Eroare la autentificare",
        description: message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Bine ați venit!",
        description: "V-ați autentificat cu succes.",
      });
      navigate('/');
    }
    
    setIsSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({
        title: "Nume obligatoriu",
        description: "Vă rugăm să introduceți numele complet.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(signupEmail)) {
      toast({
        title: "Email invalid",
        description: "Vă rugăm să introduceți o adresă de email validă.",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhone(phone)) {
      toast({
        title: "Telefon invalid",
        description: "Vă rugăm să introduceți un număr de telefon valid (10 cifre).",
        variant: "destructive",
      });
      return;
    }

    if (signupPassword.length < 6) {
      toast({
        title: "Parolă prea scurtă",
        description: "Parola trebuie să aibă cel puțin 6 caractere.",
        variant: "destructive",
      });
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      toast({
        title: "Parolele nu coincid",
        description: "Vă rugăm să verificați că parolele introduse sunt identice.",
        variant: "destructive",
      });
      return;
    }

    if (userType === 'garage' && !businessName.trim()) {
      toast({
        title: "Nume service obligatoriu",
        description: "Vă rugăm să introduceți numele service-ului.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await signUp(signupEmail, signupPassword, {
      full_name: fullName,
      user_type: userType,
      phone: phone,
    });
    
    if (error) {
      let message = "A apărut o eroare la înregistrare.";
      if (error.message.includes("already registered")) {
        message = "Acest email este deja înregistrat. Încercați să vă autentificați.";
      }
      
      toast({
        title: "Eroare la înregistrare",
        description: message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cont creat cu succes!",
        description: "Bine ați venit pe FixMyCar.ro!",
      });
      navigate('/');
    }
    
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Înapoi acasă
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

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Autentificare</TabsTrigger>
              <TabsTrigger value="signup">Înregistrare</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Bine ați revenit!</CardTitle>
                  <CardDescription>
                    Introduceți datele pentru a vă autentifica
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="email@exemplu.ro"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Parolă</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
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

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Se autentifică..." : "Autentificare"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Creați un cont nou</CardTitle>
                  <CardDescription>
                    Completați formularul pentru a vă înregistra
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    {/* User Type Selection */}
                    <div className="space-y-3">
                      <Label>Tip cont</Label>
                      <RadioGroup
                        value={userType}
                        onValueChange={(value) => setUserType(value as 'customer' | 'garage')}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div>
                          <RadioGroupItem value="customer" id="customer" className="peer sr-only" />
                          <Label
                            htmlFor="customer"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Car className="mb-2 h-6 w-6" />
                            <span className="text-sm font-medium">Client</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="garage" id="garage" className="peer sr-only" />
                          <Label
                            htmlFor="garage"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Wrench className="mb-2 h-6 w-6" />
                            <span className="text-sm font-medium">Service Auto</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="full-name">Nume complet</Label>
                      <Input
                        id="full-name"
                        type="text"
                        placeholder="Ion Popescu"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>

                    {userType === 'garage' && (
                      <div className="space-y-2">
                        <Label htmlFor="business-name">Nume service</Label>
                        <Input
                          id="business-name"
                          type="text"
                          placeholder="Auto Service SRL"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="email@exemplu.ro"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="0722 123 456"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Parolă</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
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
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Se creează contul..." : "Creează cont"}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Prin înregistrare, sunteți de acord cu{' '}
                      <Link to="/termeni" className="text-primary hover:underline">
                        Termenii și Condițiile
                      </Link>{' '}
                      și{' '}
                      <Link to="/confidentialitate" className="text-primary hover:underline">
                        Politica de Confidențialitate
                      </Link>
                    </p>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Auth;
