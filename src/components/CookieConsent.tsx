import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Cookie, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const COOKIE_CONSENT_KEY = 'cookie-consent-accepted';
const COOKIE_CONSENT_VERSION = '1.0';

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent || JSON.parse(consent).version !== COOKIE_CONSENT_VERSION) {
      // Small delay so it doesn't pop up immediately
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      version: COOKIE_CONSENT_VERSION,
      accepted: true,
      functional: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    }));
    setIsVisible(false);
  };

  const acceptEssential = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      version: COOKIE_CONSENT_VERSION,
      accepted: true,
      functional: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    }));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <Card className="max-w-4xl mx-auto p-6 shadow-2xl border-2">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary/10 flex-shrink-0">
              <Cookie className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Folosim cookie-uri 🍪</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Utilizăm cookie-uri pentru a vă oferi cea mai bună experiență pe site-ul nostru. 
                Cookie-urile esențiale sunt necesare pentru funcționarea site-ului, 
                în timp ce cookie-urile de analiză ne ajută să înțelegem cum folosiți site-ul.
              </p>
              <p className="text-sm text-muted-foreground">
                Conform{' '}
                <span className="font-medium">Legii 506/2004</span> și{' '}
                <span className="font-medium">GDPR</span>, 
                aveți dreptul să alegeți ce cookie-uri să acceptați.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 -mt-2 -mr-2"
              onClick={acceptEssential}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <div className="flex-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Link 
                to="/confidentialitate" 
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                Politica de Confidențialitate
                <ExternalLink className="h-3 w-3" />
              </Link>
              <span>•</span>
              <Link 
                to="/cookies" 
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                Politica Cookie-uri
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={acceptEssential}>
                Doar esențiale
              </Button>
              <Button onClick={acceptAll}>
                Accept toate
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CookieConsent;
