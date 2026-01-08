import { Users, BarChart3, BadgeCheck, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ForGaragesSection = () => {
  const benefits = [
    {
      icon: Users,
      title: "Mii de clienți noi",
      description: "Accesează lunar mii de șoferi care caută servicii auto în zona ta.",
    },
    {
      icon: BarChart3,
      title: "Administrare ușoară",
      description: "Gestionează cererile, ofertele și programările dintr-un singur loc.",
    },
    {
      icon: BadgeCheck,
      title: "Recenzii verificate",
      description: "Construiește-ți reputația cu recenzii reale de la clienți mulțumiți.",
    },
    {
      icon: Zap,
      title: "Răspuns instant",
      description: "Primește notificări imediate pentru cereri noi și nu pierzi nicio oportunitate.",
    },
  ];

  const navigate = useNavigate();

  return (
    <section id="pentru-garaje" className="py-20 md:py-28 bg-muted/50">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              Pentru Service-uri
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Crește-ți afacerea cu{" "}
              <span className="text-accent">FixMyCar.ro</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Alătură-te rețelei noastre de service-uri auto și conectează-te cu mii de clienți 
              din zona ta. Înscrierea este gratuită și fără obligații la început.
            </p>

            {/* Benefits List */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-accent/10 text-accent" aria-hidden="true">
                    <benefit.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              variant="default" 
              size="lg" 
              className="group"
              onClick={() => navigate("/inregistrare-service")}
            >
              Înregistrează-ți Service-ul
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Button>
          </div>

          {/* Right Side - Stats Card */}
          <div className="relative">
            <div className="relative z-10 p-8 md:p-10 rounded-3xl bg-card border border-border shadow-xl">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="font-display text-4xl md:text-5xl font-bold text-primary mb-2">
                    500+
                  </div>
                  <p className="text-muted-foreground">Service-uri partenere</p>
                </div>
                <div>
                  <div className="font-display text-4xl md:text-5xl font-bold text-accent mb-2">
                    15k+
                  </div>
                  <p className="text-muted-foreground">Cereri lunar</p>
                </div>
                <div>
                  <div className="font-display text-4xl md:text-5xl font-bold text-primary mb-2">
                    98%
                  </div>
                  <p className="text-muted-foreground">Clienți mulțumiți</p>
                </div>
                <div>
                  <div className="font-display text-4xl md:text-5xl font-bold text-accent mb-2">
                    4.8★
                  </div>
                  <p className="text-muted-foreground">Rating mediu</p>
                </div>
              </div>

              {/* Testimonial */}
              <div className="p-5 rounded-xl bg-muted/50 border border-border">
                <p className="text-foreground italic mb-3">
                  "De când suntem pe FixMyCar.ro, numărul de clienți noi a crescut cu 40%. 
                  Platforma este ușor de folosit și clienții sunt serioși."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    MP
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Mihai Popescu</p>
                    <p className="text-muted-foreground text-xs">Auto Service Expert, București</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute -top-4 -right-4 w-full h-full rounded-3xl bg-accent/20 -z-10" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-primary/10 -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForGaragesSection;
