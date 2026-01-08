import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  const navigate = useNavigate();
  const benefits = [
    "100% gratuit pentru șoferi",
    "Fără obligații",
    "Răspuns în maxim 24h",
  ];

  return (
    <section id="contact" className="py-20 md:py-28 bg-background">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-8 md:p-12 lg:p-16">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/10 rounded-full blur-2xl" />

          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
              Gata să găsești cel mai bun service auto?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Postează prima ta cerere acum și primește oferte de la service-uri 
              verificate din zona ta. Este simplu, rapid și gratuit!
            </p>

            {/* Benefits */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-10">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-2 text-primary-foreground/90"
                >
                  <CheckCircle className="w-5 h-5 text-accent" aria-hidden="true" />
                  <span className="text-sm font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Button variant="hero" size="xl" className="group" onClick={() => navigate("/cerere")}>
              Solicită Oferte Gratuit
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
