import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SEO from '@/components/SEO';
import GarageMap from '@/components/GarageMap';
import FavoriteButton from '@/components/FavoriteButton';
import StarRating from '@/components/StarRating';
import { LazyImage } from '@/components/LazyImage';
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
  Building2, 
  Filter, 
  X,
  Loader2,
  Image as ImageIcon,
  Wrench,
  List,
  Map,
  Heart,
  ShieldCheck
} from 'lucide-react';

import { RARCategoryBadges, RARCategory } from '@/components/RARCategoryBadges';
import { Database } from '@/integrations/supabase/types';

type KycStatus = Database['public']['Enums']['kyc_status'];

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
  latitude: number | null;
  longitude: number | null;
  rar_categories: RARCategory[] | null;
  kyc_status: KycStatus | null;
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
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

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

  const { data: favorites = [], refetch: refetchFavorites } = useQuery({
    queryKey: ['user-favorites-list'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select('garage_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data.map(f => f.garage_id);
    },
    staleTime: 0, // Always refetch to get latest favorites
  });

  // Auto-refetch favorites when filter is toggled on
  useEffect(() => {
    if (showFavoritesOnly) {
      refetchFavorites();
    }
  }, [showFavoritesOnly, refetchFavorites]);

  const filteredGarages = useMemo(() => {
    if (!garages) return [];

    let result = garages.filter(garage => {
      // Favorites filter
      if (showFavoritesOnly && !favorites.includes(garage.user_id)) {
        return false;
      }

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
  }, [garages, searchQuery, selectedCounty, selectedCategory, sortBy, showFavoritesOnly, favorites]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCounty('');
    setSelectedCategory('');
    setSortBy('rating');
    setShowFavoritesOnly(false);
  };

  const hasActiveFilters = searchQuery || selectedCounty || selectedCategory || showFavoritesOnly;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title="Caută Service Auto"
        description="Găsește și compară service-uri auto verificate în zona ta. Filtrează după specialitate, citește recenzii și vezi locația pe hartă."
      />
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

              <Button 
                variant={showFavoritesOnly ? 'default' : 'outline'}
                size="sm" 
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="flex items-center gap-1"
              >
                <Heart className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">Favorite</span>
              </Button>

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
                  <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden relative">
                    {/* Favorite Button & KYC Badge */}
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                      {garage.kyc_status === 'approved' && (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          <span className="hidden sm:inline">Verificat</span>
                        </Badge>
                      )}
                      <FavoriteButton garageId={garage.user_id} className="bg-background/80 backdrop-blur-sm" />
                    </div>
                    
                    {/* Gallery Preview */}
                    {garage.gallery_images && garage.gallery_images.length > 0 ? (
                      <div className="aspect-video relative overflow-hidden">
                        <LazyImage
                          src={garage.gallery_images[0]}
                          alt={`Imagine ${garage.business_name || 'Service auto'}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          containerClassName="w-full h-full"
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
                          <LazyImage
                            src={garage.avatar_url}
                            alt={`Logo ${garage.business_name || 'Service auto'}`}
                            className="w-12 h-12 rounded-lg object-cover"
                            containerClassName="w-12 h-12 rounded-lg flex-shrink-0"
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
                              <StarRating rating={garage.average_rating} size="sm" showValue />
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

                      {/* RAR Categories */}
                      {garage.rar_categories && garage.rar_categories.length > 0 && (
                        <div className="mt-3">
                          <RARCategoryBadges 
                            categories={garage.rar_categories} 
                            size="sm" 
                            maxVisible={3}
                          />
                        </div>
                      )}

                      {/* Specialties (show if no RAR categories) */}
                      {(!garage.rar_categories || garage.rar_categories.length === 0) && garage.specialties && garage.specialties.length > 0 && (
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
                <h3 className="text-xl font-semibold mb-2">
                  {showFavoritesOnly ? 'Nu ai service-uri în favorite' : 'Niciun service găsit'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {showFavoritesOnly 
                    ? 'Adaugă service-uri la favorite pentru a le vedea aici.' 
                    : 'Nu am găsit service-uri care să corespundă criteriilor tale.'}
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
