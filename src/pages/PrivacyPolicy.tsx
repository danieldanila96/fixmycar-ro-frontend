import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="py-12 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Politica de Confidențialitate
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
                  FixMyCar.ro respectă confidențialitatea datelor dumneavoastră personale. Această politică 
                  de confidențialitate explică modul în care colectăm, utilizăm, stocăm și protejăm 
                  informațiile dumneavoastră personale în conformitate cu Regulamentul General privind 
                  Protecția Datelor (GDPR) și legislația română aplicabilă.
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">2. Operatorul de date</h2>
                <p className="text-muted-foreground mb-6">
                  Operatorul datelor personale este FixMyCar.ro. Pentru orice întrebări privind protecția 
                  datelor, ne puteți contacta la adresa de email: <a href="mailto:dpo@fixmycar.ro" className="text-primary hover:underline">dpo@fixmycar.ro</a>
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">3. Date personale colectate</h2>
                <p className="text-muted-foreground mb-4">
                  Colectăm următoarele categorii de date personale:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
                  <li><strong>Date de identificare:</strong> nume, prenume, adresă de email, număr de telefon</li>
                  <li><strong>Date despre vehicul:</strong> marcă, model, an fabricație, VIN, serie CIV</li>
                  <li><strong>Date de localizare:</strong> județul și orașul pentru găsirea service-urilor apropiate</li>
                  <li><strong>Date despre utilizare:</strong> istoricul cererilor, recenzii, mesaje</li>
                  <li><strong>Date tehnice:</strong> adresa IP, tip browser, dispozitiv utilizat</li>
                </ul>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">4. Scopul prelucrării</h2>
                <p className="text-muted-foreground mb-4">
                  Datele dumneavoastră personale sunt prelucrate în următoarele scopuri:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
                  <li>Furnizarea serviciilor platformei și intermedierea între clienți și service-uri</li>
                  <li>Comunicarea cu dumneavoastră privind cererile și ofertele</li>
                  <li>Trimiterea de notificări despre programări și remindere ITP</li>
                  <li>Îmbunătățirea serviciilor noastre și personalizarea experienței</li>
                  <li>Conformarea cu obligațiile legale</li>
                </ul>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">5. Temeiul juridic</h2>
                <p className="text-muted-foreground mb-6">
                  Prelucrăm datele dumneavoastră personale în baza: consimțământului dumneavoastră, 
                  executării contractului de servicii, obligațiilor legale și interesului nostru legitim 
                  de a îmbunătăți serviciile oferite.
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">6. Partajarea datelor</h2>
                <p className="text-muted-foreground mb-4">
                  Datele dumneavoastră pot fi partajate cu:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
                  <li><strong>Service-uri auto:</strong> pentru a răspunde cererilor dumneavoastră de ofertă</li>
                  <li><strong>Furnizori de servicii:</strong> hosting, email, procesare plăți (în conformitate cu GDPR)</li>
                  <li><strong>Autorități:</strong> când suntem obligați legal</li>
                </ul>
                <p className="text-muted-foreground mb-6">
                  Nu vindem și nu închiriem datele dumneavoastră personale către terți.
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">7. Durata stocării</h2>
                <p className="text-muted-foreground mb-6">
                  Păstrăm datele dumneavoastră personale atât timp cât aveți un cont activ pe platformă 
                  sau cât este necesar pentru furnizarea serviciilor. După ștergerea contului, datele 
                  vor fi șterse sau anonimizate în termen de 30 de zile, cu excepția cazului în care 
                  legea impune păstrarea lor pentru o perioadă mai lungă.
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">8. Drepturile dumneavoastră</h2>
                <p className="text-muted-foreground mb-4">
                  Conform GDPR, aveți următoarele drepturi:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
                  <li><strong>Dreptul de acces:</strong> să solicitați o copie a datelor dumneavoastră</li>
                  <li><strong>Dreptul la rectificare:</strong> să corectați datele inexacte</li>
                  <li><strong>Dreptul la ștergere:</strong> să solicitați ștergerea datelor ("dreptul de a fi uitat")</li>
                  <li><strong>Dreptul la restricționare:</strong> să limitați prelucrarea datelor</li>
                  <li><strong>Dreptul la portabilitate:</strong> să primiți datele într-un format structurat</li>
                  <li><strong>Dreptul de opoziție:</strong> să vă opuneți prelucrării în anumite situații</li>
                  <li><strong>Dreptul de retragere a consimțământului:</strong> în orice moment</li>
                </ul>
                <p className="text-muted-foreground mb-6">
                  Pentru exercitarea acestor drepturi, contactați-ne la: <a href="mailto:dpo@fixmycar.ro" className="text-primary hover:underline">dpo@fixmycar.ro</a>
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">9. Securitatea datelor</h2>
                <p className="text-muted-foreground mb-6">
                  Implementăm măsuri tehnice și organizatorice adecvate pentru protejarea datelor 
                  dumneavoastră personale împotriva accesului neautorizat, modificării, divulgării 
                  sau distrugerii. Acestea includ criptare, acces restricționat și audituri de securitate.
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">10. Cookie-uri</h2>
                <p className="text-muted-foreground mb-6">
                  Utilizăm cookie-uri pentru a îmbunătăți experiența dumneavoastră pe platformă. 
                  Pentru informații detaliate, consultați <a href="/cookies" className="text-primary hover:underline">Politica de Cookie-uri</a>.
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">11. Modificări</h2>
                <p className="text-muted-foreground mb-6">
                  Ne rezervăm dreptul de a actualiza această politică de confidențialitate. Orice 
                  modificări vor fi publicate pe această pagină cu data actualizării. Vă recomandăm 
                  să verificați periodic această pagină.
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">12. Autoritatea de supraveghere</h2>
                <p className="text-muted-foreground mb-6">
                  Dacă considerați că drepturile dumneavoastră au fost încălcate, aveți dreptul să 
                  depuneți o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor 
                  cu Caracter Personal (ANSPDCP) - <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.dataprotection.ro</a>
                </p>

                <h2 className="text-2xl font-display font-bold text-foreground mb-4">13. Contact</h2>
                <p className="text-muted-foreground">
                  Pentru orice întrebări legate de această politică de confidențialitate sau de 
                  prelucrarea datelor dumneavoastră personale, ne puteți contacta la:
                </p>
                <ul className="list-none text-muted-foreground mt-4 space-y-1">
                  <li>Email: <a href="mailto:dpo@fixmycar.ro" className="text-primary hover:underline">dpo@fixmycar.ro</a></li>
                  <li>Email general: <a href="mailto:contact@fixmycar.ro" className="text-primary hover:underline">contact@fixmycar.ro</a></li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
