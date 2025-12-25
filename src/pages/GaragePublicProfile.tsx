import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FavoriteButton from '@/components/FavoriteButton';
import AppointmentBooking from '@/components/AppointmentBooking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  MapPin, 
  Phone, 
  Building2, 
  FileText, 
  Loader2,
  ArrowLeft,
  Image as ImageIcon,
  MessageSquare,
  User,
  Wrench
} from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

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

interface GarageProfile {
  id: string;
  user_id: string;
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
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  job_id: string;
}

const GaragePublicProfile = () => {
  const { garageId } = useParams();

  const { data: garage, isLoading: garageLoading } = useQuery({
    queryKey: ['garage-public-profile', garageId],
    queryFn: async () => {
      if (!garageId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', garageId)
        .eq('user_type', 'garage')
        .maybeSingle();
      
      if (error) throw error;
      return data as GarageProfile | null;
    },
    enabled: !!garageId,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['garage-reviews', garageId],
    queryFn: async () => {
      if (!garageId) return [];
      // Use reviews_public view to avoid exposing customer_id
      const { data, error } = await supabase
        .from('reviews_public')
        .select('*')
        .eq('garage_id', garageId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Review[];
    },
    enabled: !!garageId,
  });

  const isLoading = garageLoading || reviewsLoading;

  if (isLoading) {
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

  if (!garage) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Service negăsit</h1>
            <p className="text-muted-foreground mb-4">
              Acest service nu există sau nu este disponibil.
            </p>
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Înapoi acasă
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20 pb-8">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Înapoi
            </Link>
          </Button>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Info Card */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {garage.avatar_url ? (
                        <img
                          src={garage.avatar_url}
                          alt={garage.business_name || 'Service'}
                          className="w-24 h-24 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-10 w-10 text-primary" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold text-foreground mb-2">
                        {garage.business_name || 'Service Auto'}
                      </h1>
                      
                      {garage.average_rating !== null && garage.average_rating > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex">{renderStars(Math.round(garage.average_rating))}</div>
                          <span className="font-semibold">{garage.average_rating.toFixed(1)}</span>
                          <span className="text-muted-foreground">
                            ({garage.total_reviews} {garage.total_reviews === 1 ? 'recenzie' : 'recenzii'})
                          </span>
                        </div>
                      )}

                      {(garage.city || garage.county) && (
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <MapPin className="h-4 w-4" />
                          <span>{[garage.city, garage.county].filter(Boolean).join(', ')}</span>
                        </div>
                      )}

                      {garage.business_address && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {garage.business_address}
                        </p>
                      )}

                      {garage.rar_authorization && (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <FileText className="h-3 w-3" />
                          Autorizație RAR: {garage.rar_authorization}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Specialties */}
                  {garage.specialties && garage.specialties.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Specialități
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {garage.specialties.map((specialty) => {
                          const cat = SERVICE_CATEGORIES.find(c => c.value === specialty);
                          return (
                            <Badge key={specialty} variant="secondary">
                              {cat?.label || specialty}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {garage.description && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="font-semibold mb-2">Despre service</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {garage.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Gallery */}
              {garage.gallery_images && garage.gallery_images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Galerie Foto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {garage.gallery_images.map((url, index) => (
                        <div 
                          key={index}
                          className="aspect-square rounded-lg overflow-hidden border border-border"
                        >
                          <img
                            src={url}
                            alt={`Galerie ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Recenzii ({reviews?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reviews && reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex">{renderStars(review.rating)}</div>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(review.created_at), 'd MMM yyyy', { locale: ro })}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-foreground ml-10">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Acest service nu are încă recenzii.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {garage.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary" />
                      <a 
                        href={`tel:${garage.phone}`}
                        className="text-foreground hover:text-primary transition-colors"
                      >
                        {garage.phone}
                      </a>
                    </div>
                  )}
                  <FavoriteButton garageId={garage.user_id} variant="full" className="w-full mb-3" />
                  
                  <AppointmentBooking 
                    garageId={garage.user_id} 
                    garageName={garage.business_name || 'Service auto'} 
                  />
                  
                  <Button asChild variant="outline" className="w-full mt-3">
                    <Link to="/cerere">
                      Solicită ofertă
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {garage.average_rating?.toFixed(1) || '-'}
                      </div>
                      <p className="text-sm text-muted-foreground">Rating</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        {garage.total_reviews || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Recenzii</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GaragePublicProfile;
