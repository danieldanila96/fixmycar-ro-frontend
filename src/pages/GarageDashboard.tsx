import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, MapPin, Clock, Calendar, MessageSquare, CheckCircle, Send } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import JobFilters, { JobFiltersState } from '@/components/JobFilters';

interface Job {
  id: string;
  category: string;
  car_make: string;
  car_model: string;
  car_year: number | null;
  fuel_type: string | null;
  description: string;
  city: string;
  county: string;
  urgency: string | null;
  status: string;
  created_at: string;
  has_quoted?: boolean;
}

interface Quote {
  id: string;
  job_id: string;
  price: number;
  message: string | null;
  status: string;
  created_at: string;
  job?: Job;
}

const GarageDashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [filters, setFilters] = useState<JobFiltersState>({
    search: '',
    category: '',
    county: '',
    urgency: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/autentificare');
    }
  }, [user, loading, navigate]);

  // Fetch user profile to check if garage
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch available jobs (open status)
  const { data: availableJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['available-jobs', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check which jobs the garage has already quoted on
      const { data: myQuotes } = await supabase
        .from('quotes')
        .select('job_id')
        .eq('garage_id', user.id);

      const quotedJobIds = new Set(myQuotes?.map(q => q.job_id) || []);

      return (jobs || []).map(job => ({
        ...job,
        has_quoted: quotedJobIds.has(job.id)
      })) as Job[];
    },
    enabled: !!user,
  });

  // Fetch my quotes
  const { data: myQuotes, isLoading: quotesLoading } = useQuery({
    queryKey: ['my-quotes', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: quotesData, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('garage_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch job details for each quote
      const quotesWithJobs = await Promise.all(
        (quotesData || []).map(async (quote) => {
          const { data: jobData } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', quote.job_id)
            .single();

          return { ...quote, job: jobData };
        })
      );

      return quotesWithJobs as Quote[];
    },
    enabled: !!user,
  });

  const pendingQuotes = myQuotes?.filter(q => q.status === 'sent') || [];
  const acceptedQuotes = myQuotes?.filter(q => q.status === 'accepted') || [];
  const newJobs = availableJobs?.filter(j => !j.has_quoted) || [];

  // Extract unique categories and counties for filter dropdowns
  const categories = useMemo(() => {
    const cats = new Set(availableJobs?.map(j => j.category) || []);
    return Array.from(cats).sort();
  }, [availableJobs]);

  const counties = useMemo(() => {
    const countiesSet = new Set(availableJobs?.map(j => j.county) || []);
    return Array.from(countiesSet).sort();
  }, [availableJobs]);

  // Filter jobs based on active filters
  const filteredJobs = useMemo(() => {
    if (!availableJobs) return [];
    
    return availableJobs.filter(job => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          job.car_make.toLowerCase().includes(searchLower) ||
          job.car_model.toLowerCase().includes(searchLower) ||
          job.description.toLowerCase().includes(searchLower) ||
          job.category.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category && filters.category !== 'all' && job.category !== filters.category) {
        return false;
      }

      // County filter
      if (filters.county && filters.county !== 'all' && job.county !== filters.county) {
        return false;
      }

      // Urgency filter
      if (filters.urgency && filters.urgency !== 'all' && job.urgency !== filters.urgency) {
        return false;
      }

      return true;
    });
  }, [availableJobs, filters]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Redirect customers to their dashboard
  if (profile && profile.user_type === 'customer') {
    navigate('/contul-meu');
    return null;
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Acum câteva minute';
    if (diffHours < 24) return `Acum ${diffHours} ${diffHours === 1 ? 'oră' : 'ore'}`;
    if (diffDays < 7) return `Acum ${diffDays} ${diffDays === 1 ? 'zi' : 'zile'}`;
    return formatDate(dateStr);
  };

  const urgencyColors: Record<string, string> = {
    urgent: 'text-red-600 bg-red-100',
    normal: 'text-blue-600 bg-blue-100',
    flexibil: 'text-green-600 bg-green-100',
  };

  const JobCard = ({ job, showQuoteButton = true }: { job: Job; showQuoteButton?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">
                {job.car_make} {job.car_model} {job.car_year && `(${job.car_year})`}
              </CardTitle>
              <CardDescription>{job.category}</CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {job.urgency && (
              <Badge variant="outline" className={urgencyColors[job.urgency] || ''}>
                {job.urgency === 'urgent' ? 'Urgent' : job.urgency === 'flexibil' ? 'Flexibil' : 'Normal'}
              </Badge>
            )}
            {job.has_quoted && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Ofertă trimisă
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {job.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.city}, {job.county}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTimeAgo(job.created_at)}
            </span>
          </div>
          {showQuoteButton && !job.has_quoted && (
            <Button size="sm" onClick={() => navigate(`/service/cereri/${job.id}`)}>
              <Send className="mr-2 h-4 w-4" />
              Trimite ofertă
            </Button>
          )}
          {job.has_quoted && (
            <Button size="sm" variant="outline" onClick={() => navigate(`/service/cereri/${job.id}`)}>
              Vezi detalii
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const QuoteCard = ({ quote }: { quote: Quote }) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      sent: { label: 'În așteptare', variant: 'secondary' },
      accepted: { label: 'Acceptată', variant: 'default' },
      rejected: { label: 'Refuzată', variant: 'destructive' },
    };

    const status = statusConfig[quote.status] || statusConfig.sent;

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 text-accent">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">
                  {quote.job?.car_make} {quote.job?.car_model}
                </CardTitle>
                <CardDescription>{quote.job?.category}</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{quote.price} Lei</p>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {quote.message && (
            <p className="text-sm text-muted-foreground mb-3">{quote.message}</p>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Trimisă pe {formatDate(quote.created_at)}
            </span>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/service/cereri/${quote.job_id}`)}>
              Vezi cererea
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-20 md:pt-24">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Portal Service Auto
            </h1>
            <p className="text-muted-foreground mt-1">
              Găsește cereri de reparații și trimite oferte clienților
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-foreground">{newJobs.length}</div>
                <p className="text-sm text-muted-foreground">Cereri noi</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">{pendingQuotes.length}</div>
                <p className="text-sm text-muted-foreground">Oferte în așteptare</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{acceptedQuotes.length}</div>
                <p className="text-sm text-muted-foreground">Oferte acceptate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-accent">{profile?.average_rating || 0}</div>
                <p className="text-sm text-muted-foreground">Rating mediu</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="available" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="available">
                Cereri disponibile ({availableJobs?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="my-quotes">
                Ofertele mele ({myQuotes?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available">
              <JobFilters
                onFiltersChange={setFilters}
                categories={categories}
                counties={counties}
              />
              
              {jobsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredJobs.length > 0 ? (
                <div className="grid gap-4">
                  {filteredJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : availableJobs && availableJobs.length > 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nicio cerere găsită</h3>
                    <p className="text-muted-foreground">
                      Nu există cereri care să corespundă filtrelor selectate.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nicio cerere disponibilă</h3>
                    <p className="text-muted-foreground">
                      Momentan nu sunt cereri noi de reparații. Reveniți mai târziu.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="my-quotes">
              {quotesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : myQuotes && myQuotes.length > 0 ? (
                <div className="space-y-6">
                  {acceptedQuotes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Oferte acceptate
                      </h3>
                      <div className="grid gap-4">
                        {acceptedQuotes.map((quote) => (
                          <QuoteCard key={quote.id} quote={quote} />
                        ))}
                      </div>
                    </div>
                  )}

                  {pendingQuotes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Oferte în așteptare</h3>
                      <div className="grid gap-4">
                        {pendingQuotes.map((quote) => (
                          <QuoteCard key={quote.id} quote={quote} />
                        ))}
                      </div>
                    </div>
                  )}

                  {myQuotes.filter(q => q.status === 'rejected').length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Oferte refuzate</h3>
                      <div className="grid gap-4">
                        {myQuotes.filter(q => q.status === 'rejected').map((quote) => (
                          <QuoteCard key={quote.id} quote={quote} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nicio ofertă trimisă</h3>
                    <p className="text-muted-foreground mb-4">
                      Nu ați trimis încă nicio ofertă. Explorați cererile disponibile pentru a începe.
                    </p>
                    <Button onClick={() => document.querySelector('[value="available"]')?.dispatchEvent(new Event('click'))}>
                      Vezi cereri disponibile
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GarageDashboard;
