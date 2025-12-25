import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Shield, User, Wrench, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  user_type: 'customer' | 'garage';
  business_name: string | null;
  city: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
}

const AdminUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Fetch all users
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserProfile[];
    }
  });

  // Fetch user roles
  const { data: userRoles } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');
      
      if (error) throw error;
      return data as UserRole[];
    }
  });

  // Toggle admin role mutation
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      if (isAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        if (error) throw error;
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast({
        title: "Rol actualizat",
        description: "Rolul utilizatorului a fost actualizat cu succes.",
      });
    },
    onError: () => {
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza rolul.",
        variant: "destructive",
      });
    }
  });

  const getUserRole = (userId: string) => {
    const roles = userRoles?.filter(r => r.user_id === userId) || [];
    if (roles.some(r => r.role === 'admin')) return 'admin';
    return 'user';
  };

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery);
    
    const matchesFilter = 
      filterType === 'all' || 
      user.user_type === filterType ||
      (filterType === 'admin' && getUserRole(user.user_id) === 'admin');

    return matchesSearch && matchesFilter;
  });

  return (
    <AdminLayout 
      title="Gestionare Utilizatori" 
      description="Vizualizează și gestionează toți utilizatorii platformei"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <CardTitle>Utilizatori ({filteredUsers?.length || 0})</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Caută utilizatori..."
                  className="pl-9 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrează" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toți</SelectItem>
                  <SelectItem value="customer">Clienți</SelectItem>
                  <SelectItem value="garage">Service-uri</SelectItem>
                  <SelectItem value="admin">Admini</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilizator</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Locație</TableHead>
                  <TableHead>Înregistrat</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => {
                  const role = getUserRole(user.user_id);
                  const isAdmin = role === 'admin';

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            user.user_type === 'garage' ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            {user.user_type === 'garage' ? (
                              <Wrench className="h-4 w-4 text-green-600" />
                            ) : (
                              <User className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.user_type === 'garage' 
                                ? user.business_name || user.full_name 
                                : user.full_name}
                            </p>
                            {user.user_type === 'garage' && user.full_name && (
                              <p className="text-xs text-muted-foreground">
                                {user.full_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.user_type === 'garage' ? 'default' : 'secondary'}>
                          {user.user_type === 'garage' ? 'Service' : 'Client'}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>{user.city || '-'}</TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), 'dd MMM yyyy', { locale: ro })}
                      </TableCell>
                      <TableCell>
                        {isAdmin && (
                          <Badge variant="destructive" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={isAdmin ? "destructive" : "outline"}
                          onClick={() => toggleAdminMutation.mutate({ 
                            userId: user.user_id, 
                            isAdmin 
                          })}
                          disabled={toggleAdminMutation.isPending}
                        >
                          {isAdmin ? 'Revocă Admin' : 'Fă Admin'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!filteredUsers || filteredUsers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nu au fost găsiți utilizatori.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminUsers;
