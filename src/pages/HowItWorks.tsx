import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, MessageSquare, CheckCircle, Car, Shield, Clock, Star } from 'lucide-react';

const HowItWorks = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: FileText,
      title: 'Descrie problema',
      description: 'Completează formularul cu detaliile mașinii tale și problema pe care o ai. Cu cât ești mai specific, cu atât ofertele vor fi mai precise.',
    },
    {
      icon: Users,
      title: 'Primește oferte',
      description: 'Service-urile auto din zona ta vor primi cererea și îți vor trimite oferte personalizate. Vei primi notificări în timp real.',
    },
    {
      icon: MessageSquare,
      title: 'Compară și alege',
      description: 'Compară ofertele primite, verifică rating-ul și recenziile fiecărui service, apoi alege oferta care ți se potrivește.',
    },
    {
      icon: CheckCircle,
      title: 'Programează și repară',
      description: 'Programează-te la service-ul ales și bucură-te de o reparație de calitate. După finalizare, lasă o recenzie.',
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: 'Economisești timp',
      description: 'Nu mai pierzi ore întregi sunând la diferite service-uri. Primești oferte direct pe telefon.',
    },
    {
      icon: Shield,
      title: 'Transparență totală',
      description: 'Compari prețuri și recenzii înainte să alegi. Fără surprize neplăcute.',
    },
    {
      icon: Star,
      title: 'Service-uri verificate',
      description: 'Toate service-urile din platformă sunt verificate și au autorizațiile necesare.',
    },
    {
      icon: Car,
      title: 'Orice tip de mașină',
      description: 'Indiferent de marca sau modelul mașinii tale, găsești service-ul potrivit.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
              Cum funcționează FixMyCar.ro
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Găsești service-ul potrivit în 4 pași simpli, fără bătăi de cap
            </p>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                  <CardContent className="pt-8 pb-6 px-6">
                    <div className="absolute top-4 right-4 text-6xl font-bold text-primary/10">
                      {index + 1}
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <step.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-display font-bold text-foreground text-center mb-12">
              De ce să folosești FixMyCar.ro?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">
              Gata să începi?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Solicită oferte gratuit și găsește cel mai bun service pentru mașina ta
            </p>
            <Button size="lg" variant="accent" onClick={() => navigate('/cerere')}>
              Solicită Oferte Acum
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorks;
