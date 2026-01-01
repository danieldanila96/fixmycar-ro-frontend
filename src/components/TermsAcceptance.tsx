import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { AlertCircle, Info } from 'lucide-react';

interface TermsAcceptanceProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
  userType?: 'customer' | 'garage';
}

export const TermsAcceptance = ({
  checked,
  onCheckedChange,
  error,
  userType = 'customer'
}: TermsAcceptanceProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-start space-x-3">
        <Checkbox
          id="terms-acceptance"
          checked={checked}
          onCheckedChange={(c) => onCheckedChange(!!c)}
          className={error ? "border-destructive" : ""}
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor="terms-acceptance"
            className="text-sm font-medium leading-relaxed cursor-pointer"
          >
            Accept{' '}
            <Link to="/termeni" className="text-primary hover:underline">
              Termenii și Condițiile
            </Link>
            {' '}și{' '}
            <Link to="/confidentialitate" className="text-primary hover:underline">
              Politica de Confidențialitate
            </Link>
            {' '}*
          </Label>
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}

      {/* OUG 34/2014 Distance Contract Disclosure */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground space-y-2">
        <div className="flex items-start gap-2">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">Informații contractuale (OUG 34/2014)</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>
                Serviciile sunt furnizate de service-urile auto partenere, nu de FixMyCar.ro
              </li>
              <li>
                Dreptul de retragere de 14 zile nu se aplică serviciilor începute la cererea dvs. expresă
              </li>
              <li>
                Prețurile afișate includ TVA (acolo unde este aplicabil)
              </li>
              <li>
                Plata se efectuează online sau la service, conform opțiunii selectate
              </li>
              {userType === 'garage' && (
                <>
                  <li>
                    Ca service partener, sunteți obligat să dețineți autorizație RAR validă
                  </li>
                  <li>
                    Veți emite facturi fiscale clienților conform legislației în vigoare
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
        <p>
          Dispute: <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ANPC</a> | 
          Contact DPO: <a href="mailto:dpo@fixmycar.ro" className="text-primary hover:underline">dpo@fixmycar.ro</a>
        </p>
      </div>
    </div>
  );
};

export default TermsAcceptance;
