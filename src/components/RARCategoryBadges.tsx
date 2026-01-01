import { Badge } from '@/components/ui/badge';
import { 
  Wrench, 
  Zap, 
  PaintBucket, 
  Car, 
  Thermometer, 
  CircleDot, 
  Cpu, 
  Target,
  CheckCircle
} from 'lucide-react';

// RAR authorization categories matching the database enum
export const RAR_CATEGORIES = {
  mecanica: { label: 'Mecanică', icon: Wrench, description: 'Reparații mecanice' },
  electrica: { label: 'Electrică', icon: Zap, description: 'Sisteme electrice și electronice' },
  caroserie: { label: 'Caroserie', icon: Car, description: 'Lucrări de tinichigerie' },
  vopsitorie: { label: 'Vopsitorie', icon: PaintBucket, description: 'Vopsitorie auto' },
  itp: { label: 'ITP', icon: CheckCircle, description: 'Inspecție Tehnică Periodică' },
  ac_clima: { label: 'Climatizare', icon: Thermometer, description: 'Aer condiționat' },
  anvelope: { label: 'Anvelope', icon: CircleDot, description: 'Vulcanizare și echilibrare' },
  diagnoza: { label: 'Diagnoză', icon: Cpu, description: 'Diagnoză computerizată' },
  geometrie: { label: 'Geometrie', icon: Target, description: 'Geometrie roți' },
} as const;

export type RARCategory = keyof typeof RAR_CATEGORIES;

interface RARCategoryBadgesProps {
  categories: RARCategory[];
  showIcons?: boolean;
  size?: 'sm' | 'md';
  maxVisible?: number;
}

export const RARCategoryBadges = ({ 
  categories, 
  showIcons = true, 
  size = 'md',
  maxVisible = 6 
}: RARCategoryBadgesProps) => {
  if (!categories || categories.length === 0) return null;

  const visibleCategories = categories.slice(0, maxVisible);
  const remainingCount = categories.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-2">
      {visibleCategories.map((category) => {
        const config = RAR_CATEGORIES[category];
        if (!config) return null;
        
        const Icon = config.icon;
        
        return (
          <Badge 
            key={category} 
            variant="secondary" 
            className={`${size === 'sm' ? 'text-xs px-2 py-0.5' : 'px-3 py-1'} flex items-center gap-1.5`}
            title={config.description}
          >
            {showIcons && <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />}
            {config.label}
          </Badge>
        );
      })}
      {remainingCount > 0 && (
        <Badge variant="outline" className={size === 'sm' ? 'text-xs' : ''}>
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
};

interface RARCategorySelectorProps {
  selected: RARCategory[];
  onChange: (categories: RARCategory[]) => void;
  disabled?: boolean;
}

export const RARCategorySelector = ({ 
  selected, 
  onChange, 
  disabled = false 
}: RARCategorySelectorProps) => {
  const toggleCategory = (category: RARCategory) => {
    if (disabled) return;
    
    if (selected.includes(category)) {
      onChange(selected.filter(c => c !== category));
    } else {
      onChange([...selected, category]);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {(Object.keys(RAR_CATEGORIES) as RARCategory[]).map((category) => {
        const config = RAR_CATEGORIES[category];
        const Icon = config.icon;
        const isSelected = selected.includes(category);
        
        return (
          <button
            key={category}
            type="button"
            onClick={() => toggleCategory(category)}
            disabled={disabled}
            className={`
              p-3 rounded-lg border-2 text-left transition-all
              ${isSelected 
                ? 'border-primary bg-primary/10 text-primary' 
                : 'border-border bg-card hover:border-primary/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              <div>
                <p className="font-medium text-sm">{config.label}</p>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default RARCategoryBadges;
