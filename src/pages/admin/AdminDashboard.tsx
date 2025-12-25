import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, FileText, Star, TrendingUp, Calendar } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { ro } from 'date-fns/locale';

const AdminDashboard = () => {
  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_type, created_at');
      
      if (error) throw error;

      const totalUsers = profiles?.length || 0;
      const customers = profiles?.filter(p => p.user_type === 'customer').length || 0;
      const garages = profiles?.filter(p => p.user_type === 'garage').length || 0;
      
      // New users in last 7 days
      const sevenDaysAgo = subDays(new Date(), 7);
      const newUsers = profiles?.filter(p => 
        new Date(p.created_at) >= sevenDaysAgo
      ).length || 0;

      return { totalUsers, customers, garages, newUsers };
    }
  });

  // Fetch job stats
  const { data: jobStats } = useQuery({
    queryKey: ['admin-job-stats'],
    queryFn: async () => {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('status, created_at');
      
      if (error) throw error;

      const totalJobs = jobs?.length || 0;
      const openJobs = jobs?.filter(j => j.status === 'open').length || 0;
      const completedJobs = jobs?.filter(j => j.status === 'completed').length || 0;

      // Jobs in last 7 days
      const sevenDaysAgo = subDays(new Date(), 7);
      const newJobs = jobs?.filter(j => 
        new Date(j.created_at) >= sevenDaysAgo
      ).length || 0;

      return { totalJobs, openJobs, completedJobs, newJobs };
    }
  });

  // Fetch review stats
  const { data: reviewStats } = useQuery({
    queryKey: ['admin-review-stats'],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating, created_at');
      
      if (error) throw error;

      const totalReviews = reviews?.length || 0;
      const avgRating = reviews?.length 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : '0';

      return { totalReviews, avgRating };
    }
  });

  // Fetch appointment stats
  const { data: appointmentStats } = useQuery({
    queryKey: ['admin-appointment-stats'],
    queryFn: async () => {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('status, created_at');
      
      if (error) throw error;

      const totalAppointments = appointments?.length || 0;
      const pendingAppointments = appointments?.filter(a => a.status === 'pending').length || 0;
      const confirmedAppointments = appointments?.filter(a => a.status === 'confirmed').length || 0;

      return { totalAppointments, pendingAppointments, confirmedAppointments };
    }
  });

  // Fetch recent activity
  const { data: recentJobs } = useQuery({
    queryKey: ['admin-recent-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          category,
          city,
          status,
          created_at,
          car_make,
          car_model
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  const stats = [
    {
      title: 'Total Utilizatori',
      value: userStats?.totalUsers || 0,
      description: `${userStats?.newUsers || 0} noi în ultima săptămână`,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Service-uri',
      value: userStats?.garages || 0,
      description: 'Service-uri înregistrate',
      icon: Car,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Total Cereri',
      value: jobStats?.totalJobs || 0,
      description: `${jobStats?.openJobs || 0} active`,
      icon: FileText,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      title: 'Rating Mediu',
      value: reviewStats?.avgRating || '0',
      description: `${reviewStats?.totalReviews || 0} recenzii`,
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: 'Programări',
      value: appointmentStats?.totalAppointments || 0,
      description: `${appointmentStats?.pendingAppointments || 0} în așteptare`,
      icon: Calendar,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Cereri Noi',
      value: jobStats?.newJobs || 0,
      description: 'În ultima săptămână',
      icon: TrendingUp,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10'
    }
  ];

  return (
    <AdminLayout 
      title="Dashboard" 
      description="Prezentare generală a platformei FixMyCar.ro"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cereri Recente</CardTitle>
            <CardDescription>Ultimele cereri postate pe platformă</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs?.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">
                      {job.car_make} {job.car_model}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {job.category} • {job.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      job.status === 'open' 
                        ? 'bg-green-100 text-green-700' 
                        : job.status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {job.status === 'open' ? 'Activ' : job.status === 'completed' ? 'Finalizat' : job.status}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(job.created_at), 'dd MMM', { locale: ro })}
                    </p>
                  </div>
                </div>
              ))}
              {(!recentJobs || recentJobs.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  Nu există cereri încă.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistici Platformă</CardTitle>
            <CardDescription>Distribuția utilizatorilor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Clienți</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ 
                        width: `${userStats?.totalUsers ? (userStats.customers / userStats.totalUsers) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8">{userStats?.customers || 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Service-uri</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ 
                        width: `${userStats?.totalUsers ? (userStats.garages / userStats.totalUsers) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8">{userStats?.garages || 0}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Status Cereri</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{jobStats?.openJobs || 0}</p>
                    <p className="text-xs text-green-600">Active</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{jobStats?.completedJobs || 0}</p>
                    <p className="text-xs text-blue-600">Finalizate</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-600">{reviewStats?.totalReviews || 0}</p>
                    <p className="text-xs text-gray-600">Recenzii</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
