import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Car, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ITPRemindersManager from '@/components/ITPRemindersManager';

type JobStatus = 'open' | 'quotes_provided' | 'booked' | 'completed' | 'cancelled';

interface Job {
  id: string;
  category: string;
  car_make: string;
  car_model: string;
  car_year: number | null;
  description: string;
  city: string;
  county: string;
  status: JobStatus;
  created_at: string;
  quotes_count?: number;
}

const statusConfig: Record<JobStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  open: { label: 'Deschisă', variant: 'default', icon: <Clock className="h-3 w-3" /> },
  quotes_provided: { label: 'Oferte primite', variant: 'secondary', icon: <MessageSquare className="h-3 w-3" /> },
  booked: { label: 'Programată', variant: 'outline', icon: <CheckCircle className="h-3 w-3" /> },
  completed: { label: 'Finalizată', variant: 'outline', icon: <CheckCircle className="h-3 w-3" /> },
  cancelled: { label: 'Anulată', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/autentificare');
    }
  }, [user, loading, navigate]);

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['user-jobs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: jobsData, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get quotes count for each job
      const jobsWithQuotes = await Promise.all(
        (jobsData || []).map(async (job) => {
          const { count } = await supabase
            .from('quotes')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id);
          
          return { ...job, quotes_count: count || 0 };
        })
      );

      return jobsWithQuotes as Job[];
    },
    enabled: !!user,
  });

  const activeJobs = jobs?.filter(j => ['open', 'quotes_provided', 'booked'].includes(j.status)) || [];
  const completedJobs = jobs?.filter(j => ['completed', 'cancelled'].includes(j.status)) || [];

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const JobCard = ({ job }: { job: Job }) => {
    const status = statusConfig[job.status];
    
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/cereri/${job.id}`)}>
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
            <Badge variant={status.variant} className="flex items-center gap-1">
              {status.icon}
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {job.description}
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {job.city}, {job.county}
            </span>
            <div className="flex items-center gap-4">
              {job.quotes_count !== undefined && job.quotes_count > 0 && (
                <span className="flex items-center gap-1 text-primary font-medium">
                  <MessageSquare className="h-4 w-4" />
                  {job.quotes_count} {job.quotes_count === 1 ? 'ofertă' : 'oferte'}
                </span>
              )}
              <span className="text-muted-foreground">
                {formatDate(job.created_at)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ title, description }: { title: string; description: string }) => (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Car className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      <Button onClick={() => navigate('/cerere')}>
        <Plus className="mr-2 h-4 w-4" />
        Creează prima cerere
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 md:pt-24">
        <div className="container py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                Cererile mele
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestionează cererile de reparații și ofertele primite
              </p>
            </div>
            <Button onClick={() => navigate('/cerere')} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Cerere nouă
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-foreground">{jobs?.length || 0}</div>
                <p className="text-sm text-muted-foreground">Total cereri</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">{activeJobs.length}</div>
                <p className="text-sm text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-accent">
                  {jobs?.reduce((acc, j) => acc + (j.quotes_count || 0), 0) || 0}
                </div>
                <p className="text-sm text-muted-foreground">Oferte primite</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{completedJobs.filter(j => j.status === 'completed').length}</div>
                <p className="text-sm text-muted-foreground">Finalizate</p>
              </CardContent>
            </Card>
          </div>

          {/* ITP Reminders Section */}
          <div className="mb-8">
            <ITPRemindersManager />
          </div>

          {/* Jobs Tabs */}
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="active">
                Active ({activeJobs.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Finalizate ({completedJobs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {jobsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : activeJobs.length > 0 ? (
                <div className="grid gap-4">
                  {activeJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  title="Nicio cerere activă" 
                  description="Nu ai nicio cerere de reparații în curs. Creează una acum pentru a primi oferte de la service-uri auto."
                />
              )}
            </TabsContent>

            <TabsContent value="completed">
              {jobsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : completedJobs.length > 0 ? (
                <div className="grid gap-4">
                  {completedJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Nu ai nicio cerere finalizată încă.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
