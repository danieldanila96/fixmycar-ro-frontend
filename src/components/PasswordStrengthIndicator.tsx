import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  { label: 'Minim 6 caractere', test: (p) => p.length >= 6 },
  { label: 'Cel puțin o literă mare', test: (p) => /[A-Z]/.test(p) },
  { label: 'Cel puțin o literă mică', test: (p) => /[a-z]/.test(p) },
  { label: 'Cel puțin o cifră', test: (p) => /\d/.test(p) },
];

export const PasswordStrengthIndicator = ({ password, className }: PasswordStrengthIndicatorProps) => {
  if (!password) return null;

  const passedCount = requirements.filter(req => req.test(password)).length;
  const strength = passedCount / requirements.length;

  const getStrengthColor = () => {
    if (strength <= 0.25) return 'bg-destructive';
    if (strength <= 0.5) return 'bg-orange-500';
    if (strength <= 0.75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (strength <= 0.25) return 'Slabă';
    if (strength <= 0.5) return 'Medie';
    if (strength <= 0.75) return 'Bună';
    return 'Puternică';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Puterea parolei:</span>
          <span className={cn(
            'font-medium',
            strength <= 0.25 && 'text-destructive',
            strength > 0.25 && strength <= 0.5 && 'text-orange-500',
            strength > 0.5 && strength <= 0.75 && 'text-yellow-600',
            strength > 0.75 && 'text-green-600'
          )}>
            {getStrengthLabel()}
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className={cn('h-full transition-all duration-300', getStrengthColor())}
            style={{ width: `${strength * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <ul className="space-y-1">
        {requirements.map((req, index) => {
          const passed = req.test(password);
          return (
            <li 
              key={index}
              className={cn(
                'flex items-center gap-1.5 text-xs transition-colors',
                passed ? 'text-green-600' : 'text-muted-foreground'
              )}
            >
              {passed ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordStrengthIndicator;
