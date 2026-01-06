import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Car, MapPin, Calendar, Clock, User, MessageSquare, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface AdminJobDetailModalProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Job {
  id: string;
  car_make: string;
  car_model: string;
  car_year: number | null;
  fuel_type: string | null;
  category: string;
  description: string;
  city: string;
  county: string;
  urgency: string | null;
  status: string;
  created_at: string;
  needed_by: string | null;
  images: string[] | null;
  vin: string | null;
  civ: string | null;
  user_id: string;
}

interface Quote {
  id: string;
  price: number;
  status: string;
  created_at: string;
  garage_id: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Deschisă', variant: 'default' },
  quotes_provided: { label: 'Oferte primite', variant: 'secondary' },
  booked: { label: 'Programată', variant: 'outline' },
  completed: { label: 'Finalizată', variant: 'outline' },
  cancelled: { label: 'Anulată', variant: 'destructive' },
};

const AdminJobDetailModal = ({ jobId, open, onOpenChange }: AdminJobDetailModalProps) => {
  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['admin-job-detail', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      if (error) throw error;
      return data as Job;
    },
    enabled: !!jobId && open,
  });

  const { data: customer } = useQuery({
    queryKey: ['admin-job-customer', job?.user_id],
    queryFn: async () => {
      if (!job?.user_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, city, county')
        .eq('user_id', job.user_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!job?.user_id,
  });

  const { data: quotes } = useQuery({
    queryKey: ['admin-job-quotes', jobId],
    queryFn: async () => {
      if (!jobId) return [];
      const { data, error } = await supabase
        .from('quotes')
        .select('id, price, status, created_at, garage_id')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Quote[];
    },
    enabled: !!jobId && open,
  });

  const { data: garageProfiles } = useQuery({
    queryKey: ['admin-job-garages', quotes?.map(q => q.garage_id)],
    queryFn: async () => {
      if (!quotes?.length) return {};
      const garageIds = [...new Set(quotes.map(q => q.garage_id))];
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, business_name, full_name')
        .in('user_id', garageIds);
      if (error) throw error;
      const map: Record<string, { business_name: string | null; full_name: string | null }> = {};
      data?.forEach(g => { map[g.user_id] = g; });
      return map;
    },
    enabled: !!quotes?.length,
  });

  const status = job ? statusConfig[job.status] || statusConfig.open : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Detalii cerere
          </DialogTitle>
        </DialogHeader>

        {jobLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : job ? (
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              {/* Status & Car Info */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {job.car_make} {job.car_model} {job.car_year && `(${job.car_year})`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {job.fuel_type || 'Combustibil nespecificat'}
                    {job.vin && ` • VIN: ${job.vin}`}
                  </p>
                </div>
                {status && (
                  <Badge variant={status.variant}>{status.label}</Badge>
                )}
              </div>

              <Separator />

              {/* Category & Description */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Categorie</p>
                  <p className="font-medium">{job.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Descriere problemă</p>
                  <p className="text-sm whitespace-pre-wrap">{job.description}</p>
                </div>
              </div>

              {/* Images */}
              {job.images && job.images.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Poze atașate</p>
                  <div className="grid grid-cols-3 gap-2">
                    {job.images.map((img, i) => (
                      <a
                        key={i}
                        href={img}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-video overflow-hidden rounded-lg border hover:opacity-90"
                      >
                        <img src={img} alt={`Poză ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Location & Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{job.city}, {job.county}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(job.created_at), 'dd MMM yyyy HH:mm', { locale: ro })}</span>
                </div>
                {job.urgency && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Urgență: {job.urgency}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Customer Info */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" /> Client
                </p>
                {customer ? (
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{customer.full_name || 'Nume nespecificat'}</p>
                    {customer.phone && <p className="text-muted-foreground">Tel: {customer.phone}</p>}
                    {(customer.city || customer.county) && (
                      <p className="text-muted-foreground">{customer.city}, {customer.county}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Informații indisponibile</p>
                )}
              </div>

              <Separator />

              {/* Quotes */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Oferte ({quotes?.length || 0})
                </p>
                {quotes && quotes.length > 0 ? (
                  <div className="space-y-2">
                    {quotes.map((quote) => {
                      const garage = garageProfiles?.[quote.garage_id];
                      return (
                        <div 
                          key={quote.id} 
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div>
                            <p className="font-medium text-sm">
                              {garage?.business_name || garage?.full_name || 'Service'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(quote.created_at), 'dd MMM yyyy', { locale: ro })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{quote.price} Lei</p>
                            <Badge 
                              variant={quote.status === 'accepted' ? 'default' : quote.status === 'rejected' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {quote.status === 'accepted' ? 'Acceptată' : quote.status === 'rejected' ? 'Refuzată' : 'Trimisă'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nicio ofertă încă</p>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <p className="text-center text-muted-foreground py-8">Cererea nu a fost găsită</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminJobDetailModal;
