import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/ImageUpload';
import { GalleryUpload } from '@/components/GalleryUpload';
import { User, Building2, Phone, MapPin, FileText, Star, Loader2, Wrench, Navigation } from 'lucide-react';

const customerSchema = z.object({
  full_name: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere').max(100),
  phone: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
});

const garageSchema = z.object({
  full_name: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere').max(100),
  phone: z.string().optional(),
  business_name: z.string().min(2, 'Numele firmei trebuie să aibă cel puțin 2 caractere').max(100),
  business_address: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  rar_authorization: z.string().optional(),
  description: z.string().max(500, 'Descrierea poate avea maxim 500 caractere').optional(),
});

interface Profile {
  id: string;
  user_id: string;
  user_type: 'customer' | 'garage';
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  business_name: string | null;
  business_address: string | null;
  city: string | null;
  county: string | null;
  rar_authorization: string | null;
  description: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  gallery_images: string[] | null;
  specialties: string[] | null;
  latitude: number | null;
  longitude: number | null;
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

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Profile>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/autentificare');
    }
  }, [user, authLoading, navigate]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      if (!user) throw new Error('Nu ești autentificat');
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
          city: data.city,
          county: data.county,
          business_name: data.business_name,
          business_address: data.business_address,
          rar_authorization: data.rar_authorization,
          description: data.description,
          avatar_url: data.avatar_url,
          gallery_images: data.gallery_images,
          specialties: data.specialties,
          latitude: data.latitude,
          longitude: data.longitude,
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      setIsEditing(false);
      toast({
        title: 'Profil actualizat',
        description: 'Modificările au fost salvate cu succes.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Nu am putut salva modificările.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const schema = profile?.user_type === 'garage' ? garageSchema : customerSchema;
    const result = schema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    updateMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Nu am găsit profilul.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const isGarage = profile.user_type === 'garage';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {isGarage ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                {isGarage ? 'Profilul Service-ului' : 'Profilul Meu'}
              </CardTitle>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)}>
                  Editează
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isGarage && profile.average_rating !== null && (
                <div className="flex items-center gap-2 mb-6 p-3 bg-muted rounded-lg">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{profile.average_rating?.toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({profile.total_reviews} {profile.total_reviews === 1 ? 'recenzie' : 'recenzii'})
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex justify-center mb-6">
                  <ImageUpload
                    bucket="avatars"
                    folder={user?.id || ''}
                    currentImage={formData.avatar_url}
                    onUpload={(url) => handleChange('avatar_url', url)}
                    variant="avatar"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Nume complet</Label>
                  {isEditing ? (
                    <>
                      <Input
                        id="full_name"
                        value={formData.full_name || ''}
                        onChange={(e) => handleChange('full_name', e.target.value)}
                        placeholder="Introdu numele"
                      />
                      {errors.full_name && (
                        <p className="text-sm text-destructive">{errors.full_name}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-foreground py-2">{profile.full_name || '-'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Telefon
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="Număr de telefon"
                    />
                  ) : (
                    <p className="text-foreground py-2">{profile.phone || '-'}</p>
                  )}
                </div>

                {isGarage && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="business_name" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> Numele Service-ului
                      </Label>
                      {isEditing ? (
                        <>
                          <Input
                            id="business_name"
                            value={formData.business_name || ''}
                            onChange={(e) => handleChange('business_name', e.target.value)}
                            placeholder="Denumirea firmei"
                          />
                          {errors.business_name && (
                            <p className="text-sm text-destructive">{errors.business_name}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-foreground py-2">{profile.business_name || '-'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="business_address">Adresa Service-ului</Label>
                      {isEditing ? (
                        <Input
                          id="business_address"
                          value={formData.business_address || ''}
                          onChange={(e) => handleChange('business_address', e.target.value)}
                          placeholder="Adresa completă"
                        />
                      ) : (
                        <p className="text-foreground py-2">{profile.business_address || '-'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rar_authorization" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Autorizație RAR
                      </Label>
                      {isEditing ? (
                        <Input
                          id="rar_authorization"
                          value={formData.rar_authorization || ''}
                          onChange={(e) => handleChange('rar_authorization', e.target.value)}
                          placeholder="Număr autorizație RAR"
                        />
                      ) : (
                        <p className="text-foreground py-2">{profile.rar_authorization || '-'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descriere Service</Label>
                      {isEditing ? (
                        <>
                          <Textarea
                            id="description"
                            value={formData.description || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Descrie serviciile oferite..."
                            rows={4}
                          />
                          {errors.description && (
                            <p className="text-sm text-destructive">{errors.description}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-foreground py-2 whitespace-pre-wrap">
                          {profile.description || '-'}
                        </p>
                      )}
                    </div>

                    {/* Specialties Section */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" /> Specialități
                      </Label>
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-2">
                          {SERVICE_CATEGORIES.map((cat) => {
                            const isSelected = formData.specialties?.includes(cat.value) || false;
                            return (
                              <label
                                key={cat.value}
                                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                                  isSelected 
                                    ? 'bg-primary/10 border-primary' 
                                    : 'hover:bg-muted'
                                }`}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    const current = formData.specialties || [];
                                    const updated = checked
                                      ? [...current, cat.value]
                                      : current.filter(s => s !== cat.value);
                                    setFormData(prev => ({ ...prev, specialties: updated }));
                                  }}
                                />
                                <span className="text-sm">{cat.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {profile.specialties && profile.specialties.length > 0 ? (
                            profile.specialties.map((specialty) => {
                              const cat = SERVICE_CATEGORIES.find(c => c.value === specialty);
                              return (
                                <Badge key={specialty} variant="secondary">
                                  {cat?.label || specialty}
                                </Badge>
                              );
                            })
                          ) : (
                            <p className="text-muted-foreground">-</p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Oraș
                    </Label>
                    {isEditing ? (
                      <Input
                        id="city"
                        value={formData.city || ''}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder="Oraș"
                      />
                    ) : (
                      <p className="text-foreground py-2">{profile.city || '-'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="county">Județ</Label>
                    {isEditing ? (
                      <Input
                        id="county"
                        value={formData.county || ''}
                        onChange={(e) => handleChange('county', e.target.value)}
                        placeholder="Județ"
                      />
                    ) : (
                      <p className="text-foreground py-2">{profile.county || '-'}</p>
                    )}
                  </div>
                </div>

                {/* GPS Coordinates Section for Garages */}
                {isGarage && (
                  <div className="space-y-3 pt-4 border-t">
                    <Label className="flex items-center gap-2">
                      <Navigation className="h-4 w-4" /> Coordonate GPS (pentru hartă)
                    </Label>
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="latitude">Latitudine</Label>
                            <Input
                              id="latitude"
                              type="number"
                              step="any"
                              value={formData.latitude || ''}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                latitude: e.target.value ? parseFloat(e.target.value) : null 
                              }))}
                              placeholder="ex: 44.4268"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="longitude">Longitudine</Label>
                            <Input
                              id="longitude"
                              type="number"
                              step="any"
                              value={formData.longitude || ''}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                longitude: e.target.value ? parseFloat(e.target.value) : null 
                              }))}
                              placeholder="ex: 26.1025"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Poți găsi coordonatele pe Google Maps făcând click dreapta pe locație.
                        </p>
                      </div>
                    ) : (
                      <p className="text-foreground py-2">
                        {profile.latitude && profile.longitude 
                          ? `${profile.latitude}, ${profile.longitude}`
                          : 'Nesetat - se va folosi locația aproximativă a orașului'
                        }
                      </p>
                    )}
                  </div>
                )}

                {/* Gallery Section for Garages */}
                {isGarage && (
                  <div className="pt-6 border-t">
                    <GalleryUpload
                      userId={user?.id || ''}
                      images={formData.gallery_images || []}
                      onImagesChange={(images) => setFormData(prev => ({ ...prev, gallery_images: images }))}
                      isEditing={isEditing}
                    />
                  </div>
                )}

                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData(profile);
                        setErrors({});
                      }}
                    >
                      Anulează
                    </Button>
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Se salvează...
                        </>
                      ) : (
                        'Salvează'
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
