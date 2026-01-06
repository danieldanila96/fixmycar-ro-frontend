import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ExternalLink, Info, CheckCircle, AlertCircle } from 'lucide-react';

interface VINInputProps {
  vin: string;
  civ: string;
  onVINChange: (vin: string) => void;
  onCIVChange: (civ: string) => void;
  vinError?: string;
  civError?: string;
  showItpLink?: boolean;
}

export const VINInput = ({
  vin,
  civ,
  onVINChange,
  onCIVChange,
  vinError,
  civError,
  showItpLink = true
}: VINInputProps) => {
  const [vinValid, setVinValid] = useState<boolean | null>(null);

  // Basic VIN validation (17 characters, no I, O, Q)
  const validateVIN = (value: string) => {
    if (!value) {
      setVinValid(null);
      onVINChange('');
      return;
    }
    
    // Remove invalid characters (I, O, Q are not allowed in VINs)
    const cleanVin = value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
    // Enforce max 17 characters
    const truncatedVin = cleanVin.slice(0, 17);
    const isValid = truncatedVin.length === 17;
    setVinValid(truncatedVin.length > 0 ? isValid : null);
    onVINChange(truncatedVin);
  };

  const formatCIV = (value: string) => {
    // CIV format: Letter followed by numbers (e.g., G123456)
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    onCIVChange(cleaned.slice(0, 9));
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted/50 rounded-lg border border-border">
        <div className="flex items-start gap-2 mb-3">
          <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">De ce avem nevoie de VIN și CIV?</p>
            <p>
              Numărul VIN și seria CIV ne ajută să identificăm corect mașina ta și să oferim 
              prețuri mai precise pentru piesele necesare. Poți găsi aceste informații în 
              certificatul de înmatriculare.
            </p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vin" className="flex items-center gap-2">
            Număr VIN (Serie Șasiu)
            {vinValid === true && <CheckCircle className="h-4 w-4 text-green-500" />}
            {vinValid === false && <AlertCircle className="h-4 w-4 text-amber-500" />}
          </Label>
          <Input
            id="vin"
            placeholder="ex: WVWZZZ3CZWE123456"
            value={vin}
            onChange={(e) => validateVIN(e.target.value)}
            maxLength={17}
            className={`font-mono uppercase ${vinError ? 'border-destructive' : ''}`}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              17 caractere, fără I, O, Q
            </p>
            <p className="text-xs text-muted-foreground">
              {vin.length}/17
            </p>
          </div>
          {vinError && <p className="text-sm text-destructive">{vinError}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="civ">Seria CIV (Certificat Înmatriculare)</Label>
          <Input
            id="civ"
            placeholder="ex: G123456"
            value={civ}
            onChange={(e) => formatCIV(e.target.value)}
            maxLength={9}
            className={`font-mono uppercase ${civError ? 'border-destructive' : ''}`}
          />
          <p className="text-xs text-muted-foreground">
            Seria certificatului de înmatriculare
          </p>
          {civError && <p className="text-sm text-destructive">{civError}</p>}
        </div>
      </div>

      {showItpLink && vin && vin.length === 17 && (
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm mb-2">
            <strong>Verifică ITP-ul mașinii:</strong>
          </p>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a 
              href="https://www.rarom.ro/itp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Verifică ITP pe RAR
            </a>
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Folosește VIN-ul sau CIV-ul pe portalul RAR pentru a verifica valabilitatea ITP.
          </p>
        </div>
      )}
    </div>
  );
};

export default VINInput;
