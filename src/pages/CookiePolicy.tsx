import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cookie, Shield, Settings, BarChart3 } from 'lucide-react';

const CookiePolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Cookie className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-4xl font-bold text-foreground mb-4">
              Politica de Cookie-uri
            </h1>
            <p className="text-muted-foreground">
              Ultima actualizare: 1 Ianuarie 2026
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Ce sunt cookie-urile?</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  Cookie-urile sunt fișiere text mici stocate pe dispozitivul dumneavoastră 
                  când vizitați un site web. Acestea permit site-ului să vă recunoască și 
                  să rețină informații despre preferințele dumneavoastră.
                </p>
                <p>
                  Această politică este conformă cu <strong>Legea 506/2004</strong> privind 
                  prelucrarea datelor cu caracter personal și protecția vieții private în 
                  sectorul comunicațiilor electronice și cu <strong>Regulamentul GDPR</strong>.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Cookie-uri esențiale
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  Aceste cookie-uri sunt necesare pentru funcționarea corectă a site-ului. 
                  Nu pot fi dezactivate.
                </p>
                <ul>
                  <li><strong>Sesiune autentificare</strong> - menține sesiunea de login</li>
                  <li><strong>Preferințe cookie</strong> - memorează consimțământul pentru cookie-uri</li>
                  <li><strong>Securitate</strong> - protejează împotriva atacurilor CSRF</li>
                  <li><strong>Load balancing</strong> - asigură performanța optimă a site-ului</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Durată: Sesiune / Maxim 1 an
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Cookie-uri funcționale
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  Aceste cookie-uri permit funcționalități avansate și personalizare.
                </p>
                <ul>
                  <li><strong>Preferințe limbă</strong> - memorează limba selectată</li>
                  <li><strong>Temă vizuală</strong> - salvează preferința pentru mod întunecat/luminos</li>
                  <li><strong>Istoric căutări</strong> - sugestii bazate pe căutările anterioare</li>
                  <li><strong>Localizare</strong> - detectează regiunea pentru recomandări relevante</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Durată: Maxim 1 an
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Cookie-uri de analiză
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  Aceste cookie-uri ne ajută să înțelegem cum utilizați site-ul nostru 
                  pentru a-l îmbunătăți.
                </p>
                <ul>
                  <li><strong>Google Analytics</strong> - statistici anonime de utilizare</li>
                  <li><strong>Heatmaps</strong> - vizualizarea interacțiunilor pe pagină</li>
                  <li><strong>Performanță</strong> - măsurători ale timpilor de încărcare</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Durată: Maxim 2 ani
                </p>
                <p>
                  Datele colectate sunt anonimizate și nu vă identifică personal. 
                  Puteți opta să dezactivați aceste cookie-uri fără a afecta 
                  funcționalitatea site-ului.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cum să gestionați cookie-urile</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  Puteți controla și șterge cookie-urile prin setările browser-ului 
                  dumneavoastră:
                </p>
                <ul>
                  <li>
                    <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
                      Google Chrome
                    </a>
                  </li>
                  <li>
                    <a href="https://support.mozilla.org/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">
                      Mozilla Firefox
                    </a>
                  </li>
                  <li>
                    <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer">
                      Safari
                    </a>
                  </li>
                  <li>
                    <a href="https://support.microsoft.com/microsoft-edge/delete-cookies-in-microsoft-edge" target="_blank" rel="noopener noreferrer">
                      Microsoft Edge
                    </a>
                  </li>
                </ul>
                <p>
                  <strong>Atenție:</strong> Blocarea anumitor cookie-uri poate afecta 
                  funcționarea site-ului.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  Pentru întrebări despre politica noastră de cookie-uri, contactați-ne:
                </p>
                <ul>
                  <li>Email: <a href="mailto:dpo@fixmycar.ro">dpo@fixmycar.ro</a></li>
                  <li>
                    ANSPDCP (Autoritatea Națională pentru Protecția Datelor):{' '}
                    <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer">
                      www.dataprotection.ro
                    </a>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CookiePolicy;
