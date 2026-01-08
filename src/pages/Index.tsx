import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import ForGaragesSection from "@/components/sections/ForGaragesSection";
import CTASection from "@/components/sections/CTASection";
import SEO from "@/components/SEO";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Găsește Service Auto de Încredere"
        description="Compară prețuri, citește recenzii și programează-te online la cele mai bune service-uri auto din România. ITP, mecanică, electrică, tinichigerie și multe altele."
      />
      <Header />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <ForGaragesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
