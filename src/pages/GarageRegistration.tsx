import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Car, ArrowLeft, ArrowRight, Building2, FileCheck, Upload, 
  CheckCircle2, Eye, EyeOff, Shield, MapPin, Phone, Mail, User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ROMANIAN_COUNTIES = [
  'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani', 
  'Brăila', 'Brașov', 'București', 'Buzău', 'Călărași', 'Caraș-Severin', 
  'Cluj', 'Constanța', 'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu', 
  'Gorj', 'Harghita', 'Hunedoara', 'Ialomița', 'Iași', 'Ilfov', 'Maramureș', 
  'Mehedinți', 'Mureș', 'Neamț', 'Olt', 'Prahova', 'Sălaj', 'Satu Mare', 
  'Sibiu', 'Suceava', 'Teleorman', 'Timiș', 'Tulcea', 'Vâlcea', 'Vaslui', 'Vrancea'
];

type RarCategory = "mecanica" | "electrica" | "caroserie" | "vopsitorie" | "itp" | "ac_clima" | "anvelope" | "diagnoza" | "geometrie";

const RAR_CATEGORIES: { value: RarCategory; label: string }[] = [
  { value: 'mecanica', label: 'Mecanică' },
  { value: 'electrica', label: 'Electrică' },
  { value: 'caroserie', label: 'Caroserie' },
  { value: 'vopsitorie', label: 'Vopsitorie' },
  { value: 'itp', label: 'ITP' },
  { value: 'ac_clima', label: 'A/C & Climatizare' },
  { value: 'anvelope', label: 'Anvelope' },
  { value: 'diagnoza', label: 'Diagnoză' },
  { value: 'geometrie', label: 'Geometrie' },
];

const STEPS = [
  { id: 1, title: 'Date Cont', icon: User },
  { id: 2, title: 'Date Firmă', icon: Building2 },
  { id: 3, title: 'Verificare RAR', icon: Shield },
  { id: 4, title: 'Documente', icon: Upload },
];

const GarageRegistration = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Step 1: Account Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Step 2: Business Details
  const [businessName, setBusinessName] = useState('');
  const [cui, setCui] = useState('');
  const [caenCode, setCaenCode] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [description, setDescription] = useState('');
  
  // Step 3: RAR Verification
  const [rarAuthorization, setRarAuthorization] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<RarCategory[]>([]);
  
  // Step 4: Documents
  const [documents, setDocuments] = useState<{[key: string]: File | null}>({
    cui_certificate: null,
    rar_authorization: null,
    fiscal_certificate: null,
    identity_document: null,
  });
  const [termsAccepted, setTermsAccepted] = useState(false);

  const validateStep1 = () => {
    if (!fullName.trim()) {
      toast({ title: "Nume obligatoriu", variant: "destructive" });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Email invalid", variant: "destructive" });
      return false;
    }
    if (!/^[0-9]{10}$/.test(phone.replace(/\s/g, ''))) {
      toast({ title: "Telefon invalid (10 cifre)", variant: "destructive" });
      return false;
    }
    if (password.length < 6) {
      toast({ title: "Parola trebuie să aibă minim 6 caractere", variant: "destructive" });
      return false;
    }
    if (password !== confirmPassword) {
      toast({ title: "Parolele nu coincid", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!businessName.trim()) {
      toast({ title: "Nume service obligatoriu", variant: "destructive" });
      return false;
    }
    if (!cui.trim()) {
      toast({ title: "CUI obligatoriu", variant: "destructive" });
      return false;
    }
    if (!businessAddress.trim()) {
      toast({ title: "Adresă obligatorie", variant: "destructive" });
      return false;
    }
    if (!city.trim()) {
      toast({ title: "Oraș obligatoriu", variant: "destructive" });
      return false;
    }
    if (!county) {
      toast({ title: "Județ obligatoriu", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!rarAuthorization.trim()) {
      toast({ title: "Număr autorizație RAR obligatoriu", variant: "destructive" });
      return false;
    }
    if (selectedCategories.length === 0) {
      toast({ title: "Selectați cel puțin o categorie de servicii", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!documents.cui_certificate) {
      toast({ title: "Certificat CUI obligatoriu", variant: "destructive" });
      return false;
    }
    if (!documents.rar_authorization) {
      toast({ title: "Autorizație RAR obligatorie", variant: "destructive" });
      return false;
    }
    if (!termsAccepted) {
      toast({ title: "Trebuie să acceptați termenii și condițiile", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    let isValid = false;
    switch (currentStep) {
      case 1: isValid = validateStep1(); break;
      case 2: isValid = validateStep2(); break;
      case 3: isValid = validateStep3(); break;
    }
    if (isValid) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleFileChange = (docType: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 10 * 1024 * 1024) {
      toast({ title: "Fișierul depășește 10MB", variant: "destructive" });
      return;
    }
    setDocuments(prev => ({ ...prev, [docType]: file }));
  };

  const toggleCategory = (category: RarCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = async () => {
    if (!validateStep4()) return;
    
    setIsSubmitting(true);
    
    try {
      // Create the user account
      const { error: signUpError } = await signUp(email, password, {
        full_name: fullName,
        user_type: 'garage',
        phone: phone,
      });
      
      if (signUpError) {
        throw signUpError;
      }

      // Wait for session to be established
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Update profile with business details
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            business_name: businessName,
            cui: cui,
            caen_code: caenCode,
            business_address: businessAddress,
            city: city,
            county: county,
            description: description,
            rar_authorization: rarAuthorization,
            rar_categories: selectedCategories,
            kyc_status: 'documents_submitted',
            kyc_submitted_at: new Date().toISOString(),
          })
          .eq('user_id', session.user.id);
          
        if (profileError) {
          console.error('Profile update error:', profileError);
        }

        // Upload documents
        for (const [docType, file] of Object.entries(documents)) {
          if (file) {
            const fileName = `${session.user.id}/${docType}_${Date.now()}.${file.name.split('.').pop()}`;
            
            const { error: uploadError } = await supabase.storage
              .from('kyc-documents')
              .upload(fileName, file);
              
            if (!uploadError) {
              const { data: urlData } = supabase.storage
                .from('kyc-documents')
                .getPublicUrl(fileName);
                
              await supabase.from('garage_documents').insert({
                garage_id: session.user.id,
                document_type: docType,
                file_name: file.name,
                file_url: urlData.publicUrl,
                status: 'pending',
              });
            }
          }
        }
      }

      toast({
        title: "Înregistrare finalizată!",
        description: "Contul a fost creat. Documentele vor fi verificate în 24-48 ore.",
      });
      
      navigate('/profil');
      
    } catch (error: any) {
      let message = "A apărut o eroare la înregistrare.";
      if (error.message?.includes("already registered")) {
        message = "Acest email este deja înregistrat.";
      }
      toast({
        title: "Eroare",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Link>
          <Link to="/" className="inline-flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" />
            <span className="text-xl font-display font-bold text-foreground">
              FixMyCar<span className="text-primary">.ro</span>
            </span>
          </Link>
          <div className="w-20" />
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all
                      ${isCompleted ? 'bg-primary text-primary-foreground' : 
                        isActive ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 
                        'bg-muted text-muted-foreground'}
                    `}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          {/* Step 1: Account Details */}
          {currentStep === 1 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Date Cont
                </CardTitle>
                <CardDescription>
                  Informații pentru accesarea contului dvs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nume complet *</Label>
                  <Input
                    id="fullName"
                    placeholder="Ion Popescu"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@service.ro"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Telefon *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0722 123 456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Parolă *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minim 6 caractere"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                  <Label htmlFor="confirmPassword">Confirmă parola *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repetă parola"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Business Details */}
          {currentStep === 2 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Date Firmă
                </CardTitle>
                <CardDescription>
                  Informații despre service-ul auto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Nume service *</Label>
                  <Input
                    id="businessName"
                    placeholder="Auto Service Expert SRL"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cui">CUI *</Label>
                    <Input
                      id="cui"
                      placeholder="RO12345678"
                      value={cui}
                      onChange={(e) => setCui(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="caenCode">Cod CAEN</Label>
                    <Input
                      id="caenCode"
                      placeholder="4520"
                      value={caenCode}
                      onChange={(e) => setCaenCode(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="businessAddress">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Adresă service *
                  </Label>
                  <Input
                    id="businessAddress"
                    placeholder="Str. Mecanicilor nr. 10"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">Oraș *</Label>
                    <Input
                      id="city"
                      placeholder="București"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="county">Județ *</Label>
                    <Select value={county} onValueChange={setCounty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează județ" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROMANIAN_COUNTIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descriere service</Label>
                  <Textarea
                    id="description"
                    placeholder="Descrieți serviciile oferite, experiența și dotările..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: RAR Verification */}
          {currentStep === 3 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Verificare RAR
                </CardTitle>
                <CardDescription>
                  Autorizația RAR și categoriile de servicii
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="rarAuthorization">Număr autorizație RAR *</Label>
                  <Input
                    id="rarAuthorization"
                    placeholder="RAR-12345-2024"
                    value={rarAuthorization}
                    onChange={(e) => setRarAuthorization(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Autorizația emisă de Registrul Auto Român
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Label>Categorii de servicii autorizate *</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Selectați toate categoriile pentru care sunteți autorizat
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {RAR_CATEGORIES.map((category) => (
                      <div
                        key={category.value}
                        onClick={() => toggleCategory(category.value)}
                        className={`
                          flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all
                          ${selectedCategories.includes(category.value) 
                            ? 'border-primary bg-primary/5 text-primary' 
                            : 'border-border hover:border-primary/50'}
                        `}
                      >
                        <Checkbox
                          checked={selectedCategories.includes(category.value)}
                          onCheckedChange={() => toggleCategory(category.value)}
                        />
                        <span className="text-sm font-medium">{category.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 4: Documents */}
          {currentStep === 4 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  Documente
                </CardTitle>
                <CardDescription>
                  Încărcați documentele necesare pentru verificare
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { id: 'cui_certificate', label: 'Certificat CUI *', desc: 'Certificat de înregistrare fiscală' },
                    { id: 'rar_authorization', label: 'Autorizație RAR *', desc: 'Document autorizare RAR' },
                    { id: 'fiscal_certificate', label: 'Certificat Fiscal', desc: 'Certificat atestare fiscală' },
                    { id: 'identity_document', label: 'Act Identitate', desc: 'CI administrator' },
                  ].map((doc) => (
                    <div key={doc.id} className="space-y-2">
                      <Label htmlFor={doc.id}>{doc.label}</Label>
                      <div className={`
                        relative border-2 border-dashed rounded-lg p-4 transition-colors
                        ${documents[doc.id] ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                      `}>
                        <input
                          id={doc.id}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange(doc.id)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="text-center">
                          {documents[doc.id] ? (
                            <>
                              <CheckCircle2 className="h-8 w-8 mx-auto text-primary mb-2" />
                              <p className="text-sm font-medium truncate">{documents[doc.id]?.name}</p>
                            </>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">{doc.desc}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Formate acceptate: PDF, JPG, PNG. Dimensiune maximă: 10MB per fișier.
                </p>
                
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  />
                  <label htmlFor="terms" className="text-sm cursor-pointer">
                    Sunt de acord cu{' '}
                    <Link to="/termeni" className="text-primary hover:underline" target="_blank">
                      Termenii și Condițiile
                    </Link>{' '}
                    și declar că informațiile furnizate sunt corecte și complete.
                  </label>
                </div>
              </CardContent>
            </>
          )}

          {/* Navigation */}
          <div className="p-6 pt-0 flex justify-between">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Înapoi
              </Button>
            ) : (
              <Link to="/autentificare">
                <Button variant="ghost">
                  Ai deja cont? Autentifică-te
                </Button>
              </Link>
            )}
            
            {currentStep < 4 ? (
              <Button onClick={handleNext}>
                Continuă
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Se procesează..." : "Finalizează înregistrarea"}
              </Button>
            )}
          </div>
        </Card>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <h4 className="font-medium text-sm mb-2">ℹ️ Procesul de verificare</h4>
          <p className="text-sm text-muted-foreground">
            După înregistrare, documentele vor fi verificate în 24-48 ore. 
            Veți primi o notificare când contul este aprobat și puteți începe să primiți cereri de ofertă.
          </p>
        </div>
      </main>
    </div>
  );
};

export default GarageRegistration;
