import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="py-12 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Termeni și Condiții
            </h1>
            <p className="text-muted-foreground">
              Ultima actualizare: {new Date().toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <Card className="max-w-4xl mx-auto">
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none p-8">
                <h2 className="text-2xl font-display font-bold text-foreground mb-4">1. Introducere</h2>
                <p className="text-muted-foreground mb-6">
                  Bine ați venit pe FixMyCar.ro! Acești termeni și condiții descriu regulile și reglementările 
                  pentru utilizarea platformei noastre. Prin accesarea acestui site web, presupunem că acceptați 
                  acești termeni și condiții. Nu continuați să utilizați FixMyCar.ro dacă nu sunteți de acord cu 
                  toți termenii și condițiile prezentate pe această pagină.
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">2. Definiții</h2>
                <p className="text-muted-foreground mb-4">
                  În acești termeni și condiții:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
                  <li><strong>Platforma</strong> - site-ul web FixMyCar.ro și serviciile asociate</li>
                  <li><strong>Utilizator/Client</strong> - persoana care solicită oferte pentru servicii auto</li>
                  <li><strong>Service/Furnizor</strong> - atelierul sau service-ul auto care oferă servicii</li>
                  <li><strong>Ofertă</strong> - propunerea de preț și servicii făcută de un service</li>
                </ul>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">3. Utilizarea platformei</h2>
                <p className="text-muted-foreground mb-4">
                  FixMyCar.ro este o platformă de intermediere între clienți și service-uri auto. Rolul nostru este 
                  de a facilita comunicarea și nu suntem parte a contractelor încheiate între clienți și service-uri.
                </p>
                <p className="text-muted-foreground mb-6">
                  Prin utilizarea platformei, vă angajați să:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
                  <li>Furnizați informații corecte și complete</li>
                  <li>Nu utilizați platforma în scopuri ilegale</li>
                  <li>Respectați drepturile celorlalți utilizatori</li>
                  <li>Nu transmiteți conținut ofensator sau ilegal</li>
                </ul>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">4. Conturi de utilizator</h2>
                <p className="text-muted-foreground mb-6">
                  Pentru a utiliza anumite funcționalități ale platformei, este necesar să vă creați un cont. 
                  Sunteți responsabil pentru menținerea confidențialității contului și parolei și pentru 
                  restricționarea accesului la computer. Sunteți de acord să acceptați responsabilitatea 
                  pentru toate activitățile care au loc în cadrul contului dvs.
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">5. Servicii pentru Service-uri Auto</h2>
                <p className="text-muted-foreground mb-6">
                  Service-urile auto care se înregistrează pe platformă trebuie să dețină toate autorizațiile 
                  necesare pentru a funcționa legal. FixMyCar.ro își rezervă dreptul de a verifica și de a 
                  suspenda conturile service-urilor care nu respectă standardele de calitate sau care primesc 
                  recenzii negative repetate.
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">6. Prețuri și plăți</h2>
                <p className="text-muted-foreground mb-6">
                  Prețurile afișate în oferte sunt stabilite de fiecare service în parte. FixMyCar.ro nu 
                  intervine în stabilirea prețurilor și nu răspunde pentru eventualele diferențe între 
                  prețul din ofertă și prețul final. Plățile se efectuează direct între client și service.
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">7. Recenzii</h2>
                <p className="text-muted-foreground mb-6">
                  Utilizatorii pot lăsa recenzii pentru service-urile cu care au interacționat. Recenziile 
                  trebuie să fie oneste și să reflecte experiența reală. FixMyCar.ro își rezervă dreptul 
                  de a șterge recenziile care conțin limbaj ofensator sau care sunt vădit false.
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">8. Limitarea răspunderii</h2>
                <p className="text-muted-foreground mb-6">
                  FixMyCar.ro nu este responsabil pentru calitatea serviciilor prestate de service-uri, 
                  pentru întârzieri sau pentru orice daune rezultate din utilizarea serviciilor unui 
                  service din platformă. Responsabilitatea pentru serviciile prestate revine în totalitate 
                  service-ului care le-a efectuat.
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">9. Protecția datelor</h2>
                <p className="text-muted-foreground mb-6">
                  Respectăm confidențialitatea datelor dvs. personale în conformitate cu Regulamentul 
                  General privind Protecția Datelor (GDPR). Pentru mai multe informații, consultați 
                  Politica noastră de Confidențialitate.
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">10. Modificări ale termenilor</h2>
                <p className="text-muted-foreground mb-6">
                  Ne rezervăm dreptul de a modifica acești termeni în orice moment. Modificările intră 
                  în vigoare imediat după publicarea pe platformă. Vă recomandăm să verificați periodic 
                  această pagină pentru a fi la curent cu eventualele modificări.
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">11. Contact</h2>
                <p className="text-muted-foreground">
                  Pentru orice întrebări legate de acești termeni și condiții, ne puteți contacta la 
                  adresa de email: <a href="mailto:contact@fixmycar.ro" className="text-primary hover:underline">contact@fixmycar.ro</a>
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
