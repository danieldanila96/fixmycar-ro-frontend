import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GarageMap from '@/components/GarageMap';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  MapPin, 
  Star, 
  Building2, 
  Filter, 
  X,
  Loader2,
  Image as ImageIcon,
  Wrench,
  List,
  Map
} from 'lucide-react';

interface GarageProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  business_name: string | null;
  city: string | null;
  county: string | null;
  description: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  gallery_images: string[] | null;
  specialties: string[] | null;
}

const SERVICE_CATEGORIES = [
  { value: "revizie", label: "Revizie & Întreținere" },
  { value: "mecanica", label: "Mecanică generală" },
  { value: "electrica", label: "Electrică auto" },
  { value: "caroserie", label: "Tinichigerie & Vopsitorie" },
  { value: "diagnoza", label: "Diagnoză computerizată" },
  { value: "clima", label: "Aer condiționat" },
  { value: "frane", label: "Sistem de frânare" },
  { value: "suspensie", label: "Suspensie & Direcție" },
  { value: "distributie", label: "Distribuție" },
  { value: "geometrie", label: "Geometrie roți" },
  { value: "itp", label: "Pregătire ITP" },
  { value: "altele", label: "Altele" },
];

const ROMANIAN_COUNTIES = [
  'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani', 
  'Brașov', 'Brăila', 'București', 'Buzău', 'Caraș-Severin', 'Călărași', 
  'Cluj', 'Constanța', 'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu', 
  'Gorj', 'Harghita', 'Hunedoara', 'Ialomița', 'Iași', 'Ilfov', 'Maramureș', 
  'Mehedinți', 'Mureș', 'Neamț', 'Olt', 'Prahova', 'Satu Mare', 'Sălaj', 
  'Sibiu', 'Suceava', 'Teleorman', 'Timiș', 'Tulcea', 'Vaslui', 'Vâlcea', 
  'Vrancea'
];

const SearchGarages = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'name'>('rating');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const { data: garages, isLoading } = useQuery({
    queryKey: ['all-garages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'garage')
        .not('business_name', 'is', null);
      
      if (error) throw error;
      return data as GarageProfile[];
    },
  });

  const filteredGarages = useMemo(() => {
    if (!garages) return [];

    let result = garages.filter(garage => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          garage.business_name?.toLowerCase().includes(query) ||
          garage.description?.toLowerCase().includes(query) ||
          garage.city?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // County filter
      if (selectedCounty && selectedCounty !== 'all' && garage.county !== selectedCounty) {
        return false;
      }

      // Category filter
      if (selectedCategory && selectedCategory !== 'all') {
        if (!garage.specialties || !garage.specialties.includes(selectedCategory)) {
          return false;
        }
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.average_rating || 0) - (a.average_rating || 0);
        case 'reviews':
          return (b.total_reviews || 0) - (a.total_reviews || 0);
        case 'name':
          return (a.business_name || '').localeCompare(b.business_name || '');
        default:
          return 0;
      }
    });

    return result;
  }, [garages, searchQuery, selectedCounty, selectedCategory, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCounty('');
    setSelectedCategory('');
    setSortBy('rating');
  };

  const hasActiveFilters = searchQuery || selectedCounty || selectedCategory;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.round(rating) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20 pb-8">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
              Găsește Service-ul Potrivit
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Caută printre service-urile auto verificate și găsește cel mai bun service pentru mașina ta.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-card rounded-xl border p-4 mb-8 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Caută după nume, descriere sau oraș..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap gap-3">
              <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                <SelectTrigger className="w-[180px]">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Județ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate județele</SelectItem>
                  {ROMANIAN_COUNTIES.map((county) => (
                    <SelectItem key={county} value={county}>
                      {county}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <Wrench className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Specialitate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate specialitățile</SelectItem>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Sortează după" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="reviews">Număr recenzii</SelectItem>
                  <SelectItem value="name">Nume A-Z</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="flex items-center gap-1">
                  <X className="h-4 w-4" />
                  Șterge filtrele
                </Button>
              )}

              <div className="ml-auto">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'map')}>
                  <TabsList>
                    <TabsTrigger value="list" className="flex items-center gap-2">
                      <List className="h-4 w-4" />
                      <span className="hidden sm:inline">Listă</span>
                    </TabsTrigger>
                    <TabsTrigger value="map" className="flex items-center gap-2">
                      <Map className="h-4 w-4" />
                      <span className="hidden sm:inline">Hartă</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredGarages.length} {filteredGarages.length === 1 ? 'service găsit' : 'service-uri găsite'}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : viewMode === 'map' ? (
            <GarageMap garages={filteredGarages} selectedCounty={selectedCounty} />
          ) : filteredGarages.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGarages.map((garage) => (
                <Link 
                  key={garage.id} 
                  to={`/service/${garage.user_id}`}
                  className="group"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
                    {/* Gallery Preview */}
                    {garage.gallery_images && garage.gallery_images.length > 0 ? (
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={garage.gallery_images[0]}
                          alt={garage.business_name || 'Service'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {garage.gallery_images.length > 1 && (
                          <Badge 
                            variant="secondary" 
                            className="absolute bottom-2 right-2 flex items-center gap-1"
                          >
                            <ImageIcon className="h-3 w-3" />
                            +{garage.gallery_images.length - 1}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        <Building2 className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}

                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        {garage.avatar_url ? (
                          <img
                            src={garage.avatar_url}
                            alt={garage.business_name || 'Service'}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {garage.business_name}
                          </h3>
                          
                          {garage.average_rating && garage.average_rating > 0 ? (
                            <div className="flex items-center gap-1 mt-1">
                              <div className="flex">{renderStars(garage.average_rating)}</div>
                              <span className="text-sm font-medium ml-1">
                                {garage.average_rating.toFixed(1)}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                ({garage.total_reviews})
                              </span>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground mt-1">
                              Fără recenzii încă
                            </p>
                          )}

                          {(garage.city || garage.county) && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="truncate">
                                {[garage.city, garage.county].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Specialties */}
                      {garage.specialties && garage.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {garage.specialties.slice(0, 3).map((specialty) => {
                            const cat = SERVICE_CATEGORIES.find(c => c.value === specialty);
                            return (
                              <Badge key={specialty} variant="secondary" className="text-xs">
                                {cat?.label || specialty}
                              </Badge>
                            );
                          })}
                          {garage.specialties.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{garage.specialties.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {garage.description && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                          {garage.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Niciun service găsit</h3>
                <p className="text-muted-foreground mb-4">
                  Nu am găsit service-uri care să corespundă criteriilor tale.
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    Șterge filtrele
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchGarages;
