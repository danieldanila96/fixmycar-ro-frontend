import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Car, Wrench, MapPin, User, CheckCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { MultiImageUpload } from "@/components/MultiImageUpload";
import { VINInput } from "@/components/VINInput";
import { TermsAcceptance } from "@/components/TermsAcceptance";
import { CarSelector } from "@/components/CarSelector";

const jobSchema = z.object({
  carMake: z.string().min(1, "Selectează marca").max(100),
  carModel: z.string().min(1, "Introdu modelul").max(100),
  carYear: z.string().min(4, "Selectează anul"),
  fuelType: z.string().min(1, "Selectează combustibilul").max(50),
  serviceCategory: z.string().min(1, "Selectează categoria").max(100),
  problemDescription: z.string().min(10, "Descrie problema (min. 10 caractere)").max(2000),
  urgency: z.string().min(1, "Selectează urgența").max(50),
  city: z.string().min(1, "Introdu localitatea").max(100),
  county: z.string().min(1, "Selectează județul").max(100),
  vin: z.string().max(17).optional(),
  civ: z.string().max(9).optional(),
});

interface FormData {
  carMake: string;
  carModel: string;
  carYear: string;
  fuelType: string;
  serviceCategory: string;
  problemDescription: string;
  urgency: string;
  city: string;
  county: string;
  name: string;
  email: string;
  phone: string;
  agreeTerms: boolean;
  images: string[];
  vin: string;
  civ: string;
}

const initialFormData: FormData = {
  carMake: "",
  carModel: "",
  carYear: "",
  fuelType: "",
  serviceCategory: "",
  problemDescription: "",
  urgency: "",
  city: "",
  county: "",
  name: "",
  email: "",
  phone: "",
  agreeTerms: false,
  images: [],
  vin: "",
  civ: "",
};

const steps = [
  { id: 1, title: "Detalii mașină", icon: Car },
  { id: 2, title: "Serviciu necesar", icon: Wrench },
  { id: 3, title: "Locație", icon: MapPin },
  { id: 4, title: "Confirmare", icon: CheckCircle },
];

// Car makes and fuel types are now loaded from database via CarSelector
const serviceCategories = [
  { value: "revizie", label: "Revizie & Întreținere" },
  { value: "mecanica", label: "Mecanică generală" },
  { value: "electrica", label: "Electrică auto" },
  { value: "itp", label: "ITP" },
  { value: "diagnoza", label: "Diagnoză computerizată" },
  { value: "climatizare", label: "Climatizare" },
  { value: "frane", label: "Sistem de frânare" },
  { value: "suspensie", label: "Suspensie & Direcție" },
  { value: "caroserie", label: "Caroserie & Vopsitorie" },
  { value: "altele", label: "Altele" },
];
const urgencyOptions = [
  { value: "urgent", label: "Urgent (în 1-2 zile)" },
  { value: "normal", label: "În această săptămână" },
  { value: "flexibil", label: "Flexibil" },
];
const counties = ["București", "Cluj", "Timiș", "Iași", "Constanța", "Brașov", "Prahova", "Dolj", "Bihor", "Argeș", "Sibiu", "Bacău", "Mureș", "Galați", "Suceava", "Altul"];

const RequestQuote = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);

  // Pre-fill user data if logged in
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setFormData(prev => ({
            ...prev,
            name: profile.full_name || '',
            phone: profile.phone || '',
            email: user.email || '',
          }));
        }
      }
    };
    fetchProfile();
  }, [user]);

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    switch (step) {
      case 1:
        if (!formData.carMake) newErrors.carMake = "Selectează marca";
        if (!formData.carModel) newErrors.carModel = "Introdu modelul";
        if (!formData.carYear) newErrors.carYear = "Selectează anul";
        if (!formData.fuelType) newErrors.fuelType = "Selectează combustibilul";
        break;
      case 2:
        if (!formData.serviceCategory) newErrors.serviceCategory = "Selectează categoria";
        if (!formData.problemDescription || formData.problemDescription.length < 10) {
          newErrors.problemDescription = "Descrie problema (min. 10 caractere)";
        }
        if (!formData.urgency) newErrors.urgency = "Selectează urgența";
        break;
      case 3:
        if (!formData.county) newErrors.county = "Selectează județul";
        if (!formData.city) newErrors.city = "Introdu localitatea";
        break;
      case 4:
        if (!user) {
          // User must be logged in to submit
          newErrors.email = "Trebuie să fii autentificat";
        }
        if (!formData.agreeTerms) newErrors.agreeTerms = "Trebuie să accepți termenii";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((prev) => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Autentificare necesară",
        description: "Trebuie să fii autentificat pentru a trimite o cerere.",
        variant: "destructive",
      });
      return;
    }

    // Validate with zod
    const validation = jobSchema.safeParse(formData);
    if (!validation.success) {
      toast({
        title: "Date incomplete",
        description: "Verifică toate câmpurile obligatorii.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const categoryLabel = serviceCategories.find(c => c.value === formData.serviceCategory)?.label || formData.serviceCategory;

      const { data, error } = await supabase
        .from('jobs')
        .insert({
          user_id: user.id,
          category: categoryLabel,
          car_make: formData.carMake.trim(),
          car_model: formData.carModel.trim(),
          car_year: parseInt(formData.carYear),
          fuel_type: formData.fuelType,
          description: formData.problemDescription.trim(),
          city: formData.city.trim(),
          county: formData.county,
          urgency: formData.urgency,
          status: 'open',
          images: formData.images,
          vin: formData.vin || null,
          civ: formData.civ || null,
        })
        .select('id')
        .single();

      if (error) throw error;

      setCreatedJobId(data.id);
      setIsSubmitted(true);

      toast({
        title: "Cerere trimisă cu succes!",
        description: "Vei primi oferte de la service-uri în curând.",
      });
    } catch (error) {
      console.error('Error submitting job:', error);
      toast({
        title: "Eroare",
        description: "Nu am putut trimite cererea. Încercați din nou.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1990; year--) {
      years.push(year.toString());
    }
    return years;
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container max-w-2xl">
            <div className="text-center p-8 md:p-12 rounded-3xl bg-card border border-border shadow-lg">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-accent" />
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Cererea a fost trimisă!
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Vei primi oferte de la service-uri din zona ta. Poți urmări statusul cererii în contul tău.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {createdJobId && (
                  <Button variant="default" onClick={() => navigate(`/cereri/${createdJobId}`)}>
                    Vezi cererea
                  </Button>
                )}
                <Button variant="outline" onClick={() => navigate("/contul-meu")}>
                  Toate cererile mele
                </Button>
                <Button variant="ghost" onClick={() => { setIsSubmitted(false); setCurrentStep(1); setFormData(initialFormData); }}>
                  Trimite altă cerere
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container max-w-3xl">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Solicită oferte gratuite
            </h1>
            <p className="text-muted-foreground">
              Completează formularul și primește oferte de la service-uri verificate din zona ta.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-10 px-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      currentStep >= step.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs mt-2 font-medium hidden sm:block ${
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 sm:w-16 lg:w-24 h-1 mx-2 rounded ${
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-card border border-border rounded-2xl shadow-lg p-6 md:p-8">
            {/* Step 1: Car Details */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-display text-xl font-semibold text-foreground mb-6">
                  Detaliile mașinii tale
                </h2>
                
                <CarSelector
                  make={formData.carMake}
                  model={formData.carModel}
                  year={formData.carYear}
                  fuelType={formData.fuelType}
                  onMakeChange={(v) => updateFormData("carMake", v)}
                  onModelChange={(v) => updateFormData("carModel", v)}
                  onYearChange={(v) => updateFormData("carYear", v)}
                  onFuelTypeChange={(v) => updateFormData("fuelType", v)}
                  errors={{
                    make: errors.carMake,
                    model: errors.carModel,
                    year: errors.carYear,
                    fuelType: errors.fuelType,
                  }}
                />

                {/* VIN/CIV Input */}
                <div className="mt-6">
                  <VINInput
                    vin={formData.vin}
                    civ={formData.civ}
                    onVINChange={(v) => updateFormData("vin", v)}
                    onCIVChange={(v) => updateFormData("civ", v)}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Service Details */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-display text-xl font-semibold text-foreground mb-6">
                  Ce serviciu ai nevoie?
                </h2>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="serviceCategory">Categoria serviciului *</Label>
                    <Select value={formData.serviceCategory} onValueChange={(v) => updateFormData("serviceCategory", v)}>
                      <SelectTrigger className={errors.serviceCategory ? "border-destructive" : ""}>
                        <SelectValue placeholder="Selectează categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.serviceCategory && <p className="text-sm text-destructive">{errors.serviceCategory}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="problemDescription">Descrie problema sau serviciul necesar *</Label>
                    <Textarea
                      id="problemDescription"
                      placeholder="Descrie în detaliu problema mașinii sau ce lucrări ai nevoie să fie efectuate..."
                      value={formData.problemDescription}
                      onChange={(e) => updateFormData("problemDescription", e.target.value)}
                      className={`min-h-[120px] ${errors.problemDescription ? "border-destructive" : ""}`}
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground text-right">{formData.problemDescription.length}/2000</p>
                    {errors.problemDescription && <p className="text-sm text-destructive">{errors.problemDescription}</p>}
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label>Adaugă poze (opțional)</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Pozele ajută service-urile să înțeleagă mai bine problema.
                    </p>
                    <MultiImageUpload
                      bucket="job-images"
                      folder={user?.id || 'temp'}
                      currentImages={formData.images}
                      onUpload={(urls) => setFormData(prev => ({ ...prev, images: urls }))}
                      maxImages={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="urgency">Când ai nevoie de reparație? *</Label>
                    <Select value={formData.urgency} onValueChange={(v) => updateFormData("urgency", v)}>
                      <SelectTrigger className={errors.urgency ? "border-destructive" : ""}>
                        <SelectValue placeholder="Selectează urgența" />
                      </SelectTrigger>
                      <SelectContent>
                        {urgencyOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.urgency && <p className="text-sm text-destructive">{errors.urgency}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-display text-xl font-semibold text-foreground mb-6">
                  Unde te afli?
                </h2>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="county">Județul *</Label>
                    <Select value={formData.county} onValueChange={(v) => updateFormData("county", v)}>
                      <SelectTrigger className={errors.county ? "border-destructive" : ""}>
                        <SelectValue placeholder="Selectează județul" />
                      </SelectTrigger>
                      <SelectContent>
                        {counties.map((county) => (
                          <SelectItem key={county} value={county}>{county}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.county && <p className="text-sm text-destructive">{errors.county}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Localitatea *</Label>
                    <Input
                      id="city"
                      placeholder="ex: București, Sector 3"
                      value={formData.city}
                      onChange={(e) => updateFormData("city", e.target.value)}
                      className={errors.city ? "border-destructive" : ""}
                      maxLength={100}
                    />
                    {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground">
                    💡 Service-urile din zona ta vor primi cererea și îți vor trimite oferte personalizate.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-display text-xl font-semibold text-foreground mb-6">
                  Confirmă și trimite cererea
                </h2>

                {/* Auth Status */}
                {!authLoading && !user ? (
                  <div className="p-6 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-4">
                      <LogIn className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                          Autentificare necesară
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                          Pentru a trimite cererea și a primi oferte, trebuie să fii autentificat.
                        </p>
                        <Button onClick={() => navigate('/autentificare')} variant="default">
                          <LogIn className="mr-2 h-4 w-4" />
                          Autentifică-te
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Ești autentificat ca <strong>{user?.email}</strong>
                      </p>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="space-y-4">
                  <h3 className="font-medium">Rezumatul cererii</h3>
                  
                  <div className="grid gap-4 p-4 rounded-xl bg-muted/50 border border-border">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Mașină</p>
                        <p className="font-medium">{formData.carMake} {formData.carModel} ({formData.carYear})</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Combustibil</p>
                        <p className="font-medium">{formData.fuelType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Serviciu</p>
                        <p className="font-medium">
                          {serviceCategories.find(c => c.value === formData.serviceCategory)?.label}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Locație</p>
                        <p className="font-medium">{formData.city}, {formData.county}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Descriere</p>
                      <p className="text-sm">{formData.problemDescription}</p>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeTerms"
                    checked={formData.agreeTerms}
                    onCheckedChange={(checked) => updateFormData("agreeTerms", !!checked)}
                    className={errors.agreeTerms ? "border-destructive" : ""}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="agreeTerms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Accept termenii și condițiile *
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Sunt de acord cu{" "}
                      <Link to="/termeni" className="text-primary hover:underline">
                        Termenii și Condițiile
                      </Link>{" "}
                      și{" "}
                      <Link to="/confidentialitate" className="text-primary hover:underline">
                        Politica de Confidențialitate
                      </Link>
                    </p>
                  </div>
                </div>
                {errors.agreeTerms && <p className="text-sm text-destructive">{errors.agreeTerms}</p>}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="ghost"
                onClick={currentStep === 1 ? () => navigate("/") : handleBack}
                disabled={isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {currentStep === 1 ? "Anulează" : "Înapoi"}
              </Button>

              <Button
                onClick={handleNext}
                disabled={isSubmitting || (currentStep === 4 && !user)}
              >
                {isSubmitting ? (
                  "Se trimite..."
                ) : currentStep === 4 ? (
                  <>
                    Trimite cererea
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Continuă
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RequestQuote;
