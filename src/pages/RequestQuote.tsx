import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Car, Wrench, MapPin, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toast } from "@/hooks/use-toast";

interface FormData {
  // Car details
  carMake: string;
  carModel: string;
  carYear: string;
  fuelType: string;
  // Service details
  serviceCategory: string;
  problemDescription: string;
  urgency: string;
  // Location
  city: string;
  county: string;
  // Contact
  name: string;
  email: string;
  phone: string;
  agreeTerms: boolean;
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
};

const steps = [
  { id: 1, title: "Detalii mașină", icon: Car },
  { id: 2, title: "Serviciu necesar", icon: Wrench },
  { id: 3, title: "Locație", icon: MapPin },
  { id: 4, title: "Date contact", icon: User },
];

const carMakes = ["Dacia", "Volkswagen", "Skoda", "Ford", "Opel", "Renault", "BMW", "Mercedes", "Audi", "Toyota", "Hyundai", "Kia", "Peugeot", "Citroën", "Fiat", "Altă marcă"];
const fuelTypes = ["Benzină", "Diesel", "Hibrid", "Electric", "GPL"];
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
  { value: "saptamana", label: "În această săptămână" },
  { value: "flexibil", label: "Flexibil" },
];
const counties = ["București", "Cluj", "Timiș", "Iași", "Constanța", "Brașov", "Prahova", "Dolj", "Bihor", "Argeș", "Sibiu", "Bacău", "Mureș", "Galați", "Suceava", "Altul"];

const RequestQuote = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<FormData> = {};

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
        if (!formData.name || formData.name.length < 2) newErrors.name = "Introdu numele complet";
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Introdu un email valid";
        }
        if (!formData.phone || !/^(\+40|0)[0-9]{9}$/.test(formData.phone.replace(/\s/g, ""))) {
          newErrors.phone = "Introdu un număr valid (ex: 0722123456)";
        }
        if (!formData.agreeTerms) newErrors.agreeTerms = "Trebuie să accepți termenii" as any;
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
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    console.log("Form submitted:", formData);
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    toast({
      title: "Cerere trimisă cu succes!",
      description: "Vei primi oferte pe email în curând.",
    });
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
                Vei primi oferte de la service-uri din zona ta pe adresa <strong>{formData.email}</strong> în maxim 24 de ore.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="default" onClick={() => navigate("/")}>
                  Înapoi acasă
                </Button>
                <Button variant="outline" onClick={() => { setIsSubmitted(false); setCurrentStep(1); setFormData(initialFormData); }}>
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
                
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="carMake">Marca *</Label>
                    <Select value={formData.carMake} onValueChange={(v) => updateFormData("carMake", v)}>
                      <SelectTrigger className={errors.carMake ? "border-destructive" : ""}>
                        <SelectValue placeholder="Selectează marca" />
                      </SelectTrigger>
                      <SelectContent>
                        {carMakes.map((make) => (
                          <SelectItem key={make} value={make}>{make}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.carMake && <p className="text-sm text-destructive">{errors.carMake}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="carModel">Model *</Label>
                    <Input
                      id="carModel"
                      placeholder="ex: Logan, Golf, Octavia"
                      value={formData.carModel}
                      onChange={(e) => updateFormData("carModel", e.target.value)}
                      className={errors.carModel ? "border-destructive" : ""}
                    />
                    {errors.carModel && <p className="text-sm text-destructive">{errors.carModel}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="carYear">Anul fabricației *</Label>
                    <Select value={formData.carYear} onValueChange={(v) => updateFormData("carYear", v)}>
                      <SelectTrigger className={errors.carYear ? "border-destructive" : ""}>
                        <SelectValue placeholder="Selectează anul" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateYears().map((year) => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.carYear && <p className="text-sm text-destructive">{errors.carYear}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fuelType">Combustibil *</Label>
                    <Select value={formData.fuelType} onValueChange={(v) => updateFormData("fuelType", v)}>
                      <SelectTrigger className={errors.fuelType ? "border-destructive" : ""}>
                        <SelectValue placeholder="Selectează combustibilul" />
                      </SelectTrigger>
                      <SelectContent>
                        {fuelTypes.map((fuel) => (
                          <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.fuelType && <p className="text-sm text-destructive">{errors.fuelType}</p>}
                  </div>
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
                    />
                    {errors.problemDescription && <p className="text-sm text-destructive">{errors.problemDescription}</p>}
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

            {/* Step 4: Contact */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-display text-xl font-semibold text-foreground mb-6">
                  Datele tale de contact
                </h2>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nume complet *</Label>
                    <Input
                      id="name"
                      placeholder="ex: Ion Popescu"
                      value={formData.name}
                      onChange={(e) => updateFormData("name", e.target.value)}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ex: ion.popescu@email.com"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="ex: 0722 123 456"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                  </div>

                  <div className="flex items-start gap-3 pt-2">
                    <Checkbox
                      id="agreeTerms"
                      checked={formData.agreeTerms}
                      onCheckedChange={(checked) => updateFormData("agreeTerms", !!checked)}
                    />
                    <Label htmlFor="agreeTerms" className="text-sm leading-relaxed cursor-pointer">
                      Sunt de acord cu{" "}
                      <a href="#" className="text-primary underline hover:no-underline">Termenii și Condițiile</a>
                      {" "}și{" "}
                      <a href="#" className="text-primary underline hover:no-underline">Politica de Confidențialitate</a>
                    </Label>
                  </div>
                  {errors.agreeTerms && <p className="text-sm text-destructive">Trebuie să accepți termenii</p>}
                </div>

                {/* Summary */}
                <div className="mt-6 p-5 rounded-xl bg-muted/50 border border-border">
                  <h3 className="font-semibold text-foreground mb-3">Rezumatul cererii</h3>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Mașină:</span> <span className="font-medium">{formData.carMake} {formData.carModel} ({formData.carYear})</span></div>
                    <div><span className="text-muted-foreground">Combustibil:</span> <span className="font-medium">{formData.fuelType}</span></div>
                    <div><span className="text-muted-foreground">Serviciu:</span> <span className="font-medium">{serviceCategories.find(c => c.value === formData.serviceCategory)?.label}</span></div>
                    <div><span className="text-muted-foreground">Locație:</span> <span className="font-medium">{formData.city}, {formData.county}</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={currentStep === 1 ? "invisible" : ""}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Înapoi
              </Button>
              
              <Button
                variant="accent"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Se trimite..."
                ) : currentStep === 4 ? (
                  <>Trimite cererea</>
                ) : (
                  <>
                    Continuă
                    <ArrowRight className="w-4 h-4 ml-2" />
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
