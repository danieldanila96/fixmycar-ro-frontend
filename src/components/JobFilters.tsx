import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface JobFiltersProps {
  onFiltersChange: (filters: JobFiltersState) => void;
  categories: string[];
  counties: string[];
}

export interface JobFiltersState {
  search: string;
  category: string;
  county: string;
  urgency: string;
}

const JobFilters = ({ onFiltersChange, categories, counties }: JobFiltersProps) => {
  const [filters, setFilters] = useState<JobFiltersState>({
    search: '',
    category: '',
    county: '',
    urgency: '',
  });

  const updateFilter = (key: keyof JobFiltersState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = { search: '', category: '', county: '', urgency: '' };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="space-y-4 mb-6">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Caută după marcă, model sau descriere..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter dropdowns */}
      <div className="flex flex-wrap gap-3">
        <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate categoriile</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.county} onValueChange={(value) => updateFilter('county', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Județ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate județele</SelectItem>
            {counties.map((county) => (
              <SelectItem key={county} value={county}>
                {county}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.urgency} onValueChange={(value) => updateFilter('urgency', value)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Urgență" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="flexibil">Flexibil</SelectItem>
          </SelectContent>
        </Select>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="flex items-center gap-1">
            <X className="h-4 w-4" />
            Șterge filtrele
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          </Button>
        )}
      </div>
    </div>
  );
};

export default JobFilters;
