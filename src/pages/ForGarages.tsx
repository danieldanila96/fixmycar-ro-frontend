import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Users, 
  BarChart3, 
  BadgeCheck, 
  Zap, 
  ArrowRight, 
  Shield, 
  Clock, 
  TrendingUp,
  MessageSquare,
  Calendar,
  Star,
  CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const ForGarages = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Users,
      title: "Mii de clienți noi",
      description: "Accesează lunar mii de șoferi care caută servicii auto în zona ta. Extinde-ți baza de clienți fără efort de marketing.",
    },
    {
      icon: BarChart3,
      title: "Administrare ușoară",
      description: "Gestionează cererile, ofertele și programările dintr-un singur loc cu un dashboard intuitiv.",
    },
    {
      icon: BadgeCheck,
      title: "Recenzii verificate",
      description: "Construiește-ți reputația cu recenzii reale de la clienți mulțumiți. Fiecare recenzie este verificată.",
    },
    {
      icon: Zap,
      title: "Răspuns instant",
      description: "Primește notificări imediate pentru cereri noi și nu pierzi nicio oportunitate de afaceri.",
    },
    {
      icon: Shield,
      title: "Verificare RAR",
      description: "Service-urile verificate RAR primesc un badge special care crește încrederea clienților.",
    },
    {
      icon: Clock,
      title: "Economie de timp",
      description: "Fără apeluri telefonice interminabile. Clienții îți trimit direct detaliile reparației.",
    },
  ];

  const features = [
    {
      icon: MessageSquare,
      title: "Mesagerie integrată",
      description: "Comunică direct cu clienții prin platforma noastră securizată.",
    },
    {
      icon: Calendar,
      title: "Programări online",
      description: "Clienții pot programa direct în funcție de disponibilitatea ta.",
    },
    {
      icon: TrendingUp,
      title: "Statistici detaliate",
      description: "Urmărește performanța și optimizează-ți afacerea cu date concrete.",
    },
    {
      icon: Star,
      title: "Profil personalizat",
      description: "Galerie foto, specializări, program și toate detaliile service-ului tău.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Înregistrează-te gratuit",
      description: "Creează un cont și completează profilul service-ului tău cu toate detaliile necesare.",
    },
    {
      number: "02",
      title: "Verifică-ți identitatea",
      description: "Încarcă documentele pentru verificare RAR și obține badge-ul de service verificat.",
    },
    {
      number: "03",
      title: "Primește cereri",
      description: "Începe să primești cereri de ofertă de la șoferi din zona ta.",
    },
    {
      number: "04",
      title: "Crește-ți afacerea",
      description: "Trimite oferte, câștigă clienți noi și construiește-ți reputația.",
    },
  ];

  const testimonials = [
    {
      quote: "De când suntem pe FixMyCar.ro, numărul de clienți noi a crescut cu 40%. Platforma este ușor de folosit și clienții sunt serioși.",
      author: "Mihai Popescu",
      role: "Auto Service Expert, București",
      initials: "MP",
    },
    {
      quote: "Am încercat multe metode de promovare, dar FixMyCar.ro ne aduce cei mai calificați clienți. Recomand cu încredere!",
      author: "Alexandru Ionescu",
      role: "Service Auto Premium, Cluj",
      initials: "AI",
    },
    {
      quote: "Sistemul de recenzii ne-a ajutat să ne construim o reputație solidă. Clienții vin pregătiți și știu ce vor.",
      author: "Dan Gheorghe",
      role: "Mecanica Dan, Timișoara",
      initials: "DG",
    },
  ];

  const pricingFeatures = [
    "Înregistrare și profil gratuit",
    "Primire nelimitată de cereri",
    "Mesagerie cu clienții",
    "Recenzii și rating",
    "Notificări instant",
    "Dashboard de administrare",
    "Suport tehnic",
    "Fără taxe ascunse",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                Pentru Service-uri Auto
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Crește-ți afacerea cu{" "}
                <span className="text-accent">FixMyCar.ro</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Alătură-te rețelei noastre de service-uri auto și conectează-te cu mii de clienți 
                din zona ta. Înscrierea este gratuită și fără obligații.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="group text-lg px-8"
                  onClick={() => navigate("/autentificare?tip=garaj")}
                >
                  Înregistrează-ți Service-ul
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8"
                  onClick={() => navigate("/cum-functioneaza")}
                >
                  Cum funcționează
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/50">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="font-display text-4xl md:text-5xl font-bold text-primary mb-2">500+</div>
                <p className="text-muted-foreground">Service-uri partenere</p>
              </div>
              <div className="text-center">
                <div className="font-display text-4xl md:text-5xl font-bold text-accent mb-2">15k+</div>
                <p className="text-muted-foreground">Cereri lunar</p>
              </div>
              <div className="text-center">
                <div className="font-display text-4xl md:text-5xl font-bold text-primary mb-2">98%</div>
                <p className="text-muted-foreground">Clienți mulțumiți</p>
              </div>
              <div className="text-center">
                <div className="font-display text-4xl md:text-5xl font-bold text-accent mb-2">4.8★</div>
                <p className="text-muted-foreground">Rating mediu</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                De ce să te alături rețelei noastre?
              </h2>
              <p className="text-lg text-muted-foreground">
                Oferim toate instrumentele de care ai nevoie pentru a-ți crește afacerea.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit) => (
                <Card key={benefit.title} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-accent/10 text-accent mb-4">
                    <benefit.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-xl text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 md:py-28 bg-muted/50">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Cum funcționează pentru service-uri
              </h2>
              <p className="text-lg text-muted-foreground">
                Patru pași simpli pentru a începe să primești clienți noi.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <div key={step.number} className="relative">
                  <div className="text-6xl font-display font-bold text-primary/10 mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-xl text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                  {index < steps.length - 1 && (
                    <ArrowRight className="hidden lg:block absolute top-8 -right-4 w-8 h-8 text-primary/30" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Instrumente puternice pentru afacerea ta
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Dashboard-ul nostru îți oferă toate funcționalitățile necesare pentru 
                  a gestiona eficient cererile și programările.
                </p>
                <div className="grid sm:grid-cols-2 gap-6">
                  {features.map((feature) => (
                    <div key={feature.title} className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <feature.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <Card className="p-8 shadow-xl">
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                    <BarChart3 className="w-16 h-16 text-muted-foreground/50" />
                  </div>
                  <p className="text-center text-muted-foreground">
                    Preview Dashboard Service
                  </p>
                </Card>
                <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-accent/20 -z-10" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-primary/10 -z-10" />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 md:py-28 bg-muted/50">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ce spun partenerii noștri
              </h2>
              <p className="text-lg text-muted-foreground">
                Service-uri din toată țara ne-au ales pentru a-și dezvolta afacerea.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.author} className="p-6">
                  <p className="text-foreground italic mb-6">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                      {testimonial.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.author}</p>
                      <p className="text-muted-foreground text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <Card className="p-8 md:p-12 text-center border-2 border-primary/20">
                <span className="inline-block px-4 py-1 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
                  Gratuit pentru început
                </span>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Înscrierea este gratuită
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Începe fără niciun cost. Plătești doar un mic comision pentru lucrările confirmate.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 text-left mb-8">
                  {pricingFeatures.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  size="lg" 
                  className="text-lg px-10"
                  onClick={() => navigate("/autentificare?tip=garaj")}
                >
                  Înregistrează-te acum
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28 bg-primary text-primary-foreground">
          <div className="container text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              Pregătit să-ți crești afacerea?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Alătură-te celor peste 500 de service-uri care deja folosesc FixMyCar.ro 
              pentru a găsi clienți noi în fiecare zi.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-10"
              onClick={() => navigate("/autentificare?tip=garaj")}
            >
              Începe gratuit
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ForGarages;
