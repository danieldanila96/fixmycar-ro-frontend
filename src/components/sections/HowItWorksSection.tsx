import { FileText, MessageSquare, CalendarCheck, Star } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      icon: FileText,
      step: "01",
      title: "Postează o cerere",
      description: "Introdu datele mașinii tale și problema sau serviciul de care ai nevoie. Este gratuit și durează doar 2 minute.",
    },
    {
      icon: MessageSquare,
      step: "02",
      title: "Primește oferte",
      description: "Service-urile din zona ta îți trimit oferte de preț. Compară prețurile și citește recenziile altor clienți.",
    },
    {
      icon: CalendarCheck,
      step: "03",
      title: "Alege și programează",
      description: "Selectează oferta care ți se potrivește și programează-te online. Plătești doar când ești mulțumit.",
    },
    {
      icon: Star,
      step: "04",
      title: "Lasă o recenzie",
      description: "După finalizarea lucrării, lasă o recenzie pentru a ajuta alți șoferi să aleagă cel mai bun service.",
    },
  ];

  return (
    <section id="cum-functioneaza" className="py-20 md:py-28 bg-background">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
            Simplu și rapid
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Cum funcționează
          </h2>
          <p className="text-lg text-muted-foreground">
            În doar 4 pași simpli, găsești service-ul perfect pentru mașina ta. 
            Tu ești la volan – alegerea îți aparține.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="group relative p-6 rounded-2xl bg-card border border-border hover:border-accent/30 hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Step Number */}
              <span className="absolute -top-3 -right-3 w-10 h-10 flex items-center justify-center rounded-full bg-accent text-accent-foreground font-bold text-sm shadow-md">
                {step.step}
              </span>

              {/* Icon */}
              <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-primary/5 text-primary mb-5 group-hover:bg-accent/10 group-hover:text-accent transition-colors" aria-hidden="true">
                <step.icon className="w-7 h-7" />
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>

              {/* Connector Line (hidden on last item and mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
