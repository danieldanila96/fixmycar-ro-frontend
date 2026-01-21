import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface CarSelectorProps {
  make: string;
  model: string;
  year: string;
  fuelType: string;
  engineId?: string;
  onMakeChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onFuelTypeChange: (value: string) => void;
  onEngineChange?: (value: string) => void;
  errors?: {
    make?: string;
    model?: string;
    year?: string;
    fuelType?: string;
  };
  showEngineSelector?: boolean;
}

const FUEL_TYPES = ['Benzină', 'Diesel', 'Hibrid', 'Electric', 'GPL'];
const OTHER_MAKE = '__other__';
const OTHER_MODEL = '__other__';

export const CarSelector = ({
  make,
  model,
  year,
  fuelType,
  engineId,
  onMakeChange,
  onModelChange,
  onYearChange,
  onFuelTypeChange,
  onEngineChange,
  errors = {},
  showEngineSelector = false,
}: CarSelectorProps) => {
  const [manualMake, setManualMake] = useState(false);
  const [manualModel, setManualModel] = useState(false);
  const [customMake, setCustomMake] = useState('');
  const [customModel, setCustomModel] = useState('');

  // Fetch all car makes from DB
  const { data: makes = [], isLoading: makesLoading } = useQuery({
    queryKey: ['car-makes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('car_makes')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Find the selected make's ID
  const selectedMakeId = makes.find((m) => m.name === make)?.id;

  // Fetch models for the selected make
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['car-models', selectedMakeId],
    queryFn: async () => {
      if (!selectedMakeId) return [];
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name, generation, year_start, year_end')
        .eq('make_id', selectedMakeId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedMakeId && !manualMake,
  });

  // Find the selected model's ID
  const selectedModelData = models.find((m) => {
    const displayName = m.generation ? `${m.name} (${m.generation})` : m.name;
    return displayName === model || m.name === model;
  });

  // Fetch engines for the selected model
  const { data: engines = [], isLoading: enginesLoading } = useQuery({
    queryKey: ['car-engines', selectedModelData?.id],
    queryFn: async () => {
      if (!selectedModelData?.id) return [];
      const { data, error } = await supabase
        .from('car_engines')
        .select('id, name, fuel_type, power_hp, displacement_cc')
        .eq('model_id', selectedModelData.id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedModelData?.id && showEngineSelector && !manualModel,
  });

  // Generate years based on selected model or default range
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    
    if (selectedModelData && !manualModel) {
      const startYear = selectedModelData.year_start || 1995;
      const endYear = selectedModelData.year_end || currentYear;
      for (let y = endYear; y >= startYear; y--) {
        years.push(y.toString());
      }
    } else {
      for (let y = currentYear; y >= 1990; y--) {
        years.push(y.toString());
      }
    }
    return years;
  };

  // Handle manual make toggle
  const handleManualMakeToggle = (checked: boolean) => {
    setManualMake(checked);
    if (checked) {
      onMakeChange(customMake);
      onModelChange('');
      setManualModel(true);
    } else {
      setCustomMake('');
      onMakeChange('');
      onModelChange('');
    }
  };

  // Handle manual model toggle
  const handleManualModelToggle = (checked: boolean) => {
    setManualModel(checked);
    if (checked) {
      onModelChange(customModel);
    } else {
      setCustomModel('');
      onModelChange('');
    }
  };

  // Sync custom inputs with form
  useEffect(() => {
    if (manualMake && customMake) {
      onMakeChange(customMake);
    }
  }, [customMake, manualMake, onMakeChange]);

  useEffect(() => {
    if (manualModel && customModel) {
      onModelChange(customModel);
    }
  }, [customModel, manualModel, onModelChange]);

  // Reset model when make changes
  const handleMakeSelect = (value: string) => {
    if (value === OTHER_MAKE) {
      handleManualMakeToggle(true);
    } else {
      setManualMake(false);
      setManualModel(false);
      onMakeChange(value);
      onModelChange('');
      onYearChange('');
      if (onEngineChange) onEngineChange('');
    }
  };

  // Handle model selection
  const handleModelSelect = (value: string) => {
    if (value === OTHER_MODEL) {
      handleManualModelToggle(true);
    } else {
      setManualModel(false);
      onModelChange(value);
      onYearChange('');
      if (onEngineChange) onEngineChange('');
    }
  };

  return (
    <div className="grid sm:grid-cols-2 gap-5">
      {/* Make Selector */}
      <div className="space-y-2">
        <Label htmlFor="carMake">Marca *</Label>
        {manualMake ? (
          <div className="space-y-2">
            <Input
              placeholder="Introdu marca mașinii"
              value={customMake}
              onChange={(e) => setCustomMake(e.target.value)}
              className={errors.make ? 'border-destructive' : ''}
              maxLength={100}
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useDbMake"
                checked={false}
                onCheckedChange={() => handleManualMakeToggle(false)}
              />
              <label htmlFor="useDbMake" className="text-sm text-muted-foreground cursor-pointer">
                Înapoi la listă
              </label>
            </div>
          </div>
        ) : (
          <Select value={make} onValueChange={handleMakeSelect}>
            <SelectTrigger className={errors.make ? 'border-destructive' : ''}>
              <SelectValue placeholder={makesLoading ? 'Se încarcă...' : 'Selectează marca'} />
            </SelectTrigger>
            <SelectContent>
              {makesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <>
                  {makes.map((m) => (
                    <SelectItem key={m.id} value={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={OTHER_MAKE} className="text-muted-foreground border-t mt-1 pt-2">
                    ➕ Altă marcă...
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        )}
        {errors.make && <p className="text-sm text-destructive">{errors.make}</p>}
      </div>

      {/* Model Selector */}
      <div className="space-y-2">
        <Label htmlFor="carModel">Model *</Label>
        {manualModel || manualMake ? (
          <div className="space-y-2">
            <Input
              placeholder="Introdu modelul mașinii"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              className={errors.model ? 'border-destructive' : ''}
              maxLength={100}
            />
            {!manualMake && models.length > 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useDbModel"
                  checked={false}
                  onCheckedChange={() => handleManualModelToggle(false)}
                />
                <label htmlFor="useDbModel" className="text-sm text-muted-foreground cursor-pointer">
                  Înapoi la listă
                </label>
              </div>
            )}
          </div>
        ) : (
          <Select value={model} onValueChange={handleModelSelect} disabled={!make}>
            <SelectTrigger className={errors.model ? 'border-destructive' : ''}>
              <SelectValue 
                placeholder={
                  !make 
                    ? 'Selectează mai întâi marca' 
                    : modelsLoading 
                      ? 'Se încarcă...' 
                      : 'Selectează modelul'
                } 
              />
            </SelectTrigger>
            <SelectContent>
              {modelsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : models.length === 0 ? (
                <div className="py-2 px-3 text-sm text-muted-foreground">
                  Niciun model găsit. Introdu manual.
                </div>
              ) : (
                <>
                  {models.map((m) => {
                    const displayName = m.generation ? `${m.name} (${m.generation})` : m.name;
                    const yearRange = m.year_end 
                      ? `${m.year_start}-${m.year_end}` 
                      : `${m.year_start}-prezent`;
                    return (
                      <SelectItem key={m.id} value={displayName}>
                        {displayName} <span className="text-muted-foreground text-xs">({yearRange})</span>
                      </SelectItem>
                    );
                  })}
                  <SelectItem value={OTHER_MODEL} className="text-muted-foreground border-t mt-1 pt-2">
                    ➕ Alt model...
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        )}
        {errors.model && <p className="text-sm text-destructive">{errors.model}</p>}
      </div>

      {/* Year Selector */}
      <div className="space-y-2">
        <Label htmlFor="carYear">Anul fabricației *</Label>
        <Select value={year} onValueChange={onYearChange}>
          <SelectTrigger className={errors.year ? 'border-destructive' : ''}>
            <SelectValue placeholder="Selectează anul" />
          </SelectTrigger>
          <SelectContent>
            {generateYears().map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.year && <p className="text-sm text-destructive">{errors.year}</p>}
      </div>

      {/* Fuel Type Selector */}
      <div className="space-y-2">
        <Label htmlFor="fuelType">Combustibil *</Label>
        <Select value={fuelType} onValueChange={onFuelTypeChange}>
          <SelectTrigger className={errors.fuelType ? 'border-destructive' : ''}>
            <SelectValue placeholder="Selectează combustibilul" />
          </SelectTrigger>
          <SelectContent>
            {FUEL_TYPES.map((fuel) => (
              <SelectItem key={fuel} value={fuel}>
                {fuel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.fuelType && <p className="text-sm text-destructive">{errors.fuelType}</p>}
      </div>

      {/* Engine Selector (optional) */}
      {showEngineSelector && engines.length > 0 && !manualModel && !manualMake && (
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="engine">Motorizare (opțional)</Label>
          <Select value={engineId || ''} onValueChange={onEngineChange}>
            <SelectTrigger>
              <SelectValue placeholder={enginesLoading ? 'Se încarcă...' : 'Selectează motorizarea'} />
            </SelectTrigger>
            <SelectContent>
              {enginesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                engines.map((e) => {
                  const power = e.power_hp ? `${e.power_hp} CP` : '';
                  const displacement = e.displacement_cc ? `${(e.displacement_cc / 1000).toFixed(1)}L` : '';
                  const details = [displacement, power, e.fuel_type].filter(Boolean).join(' • ');
                  return (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} <span className="text-muted-foreground text-xs">({details})</span>
                    </SelectItem>
                  );
                })
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Selectează motorizarea pentru oferte mai precise
          </p>
        </div>
      )}
    </div>
  );
};

export default CarSelector;
