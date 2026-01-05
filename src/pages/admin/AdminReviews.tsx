import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import StarRating from '@/components/StarRating';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Search, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  garage_id: string;
  customer_id: string;
}

const AdminReviews = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);

  // Fetch all reviews
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Review[];
    }
  });

  // Fetch profiles for displaying names
  const { data: profiles } = useQuery({
    queryKey: ['admin-profiles-for-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, business_name, user_type');
      
      if (error) throw error;
      return data;
    }
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({
        title: "Recenzie ștearsă",
        description: "Recenzia a fost ștearsă cu succes.",
      });
      setDeleteReviewId(null);
    },
    onError: () => {
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge recenzia.",
        variant: "destructive",
      });
    }
  });

  const getProfileName = (userId: string) => {
    const profile = profiles?.find(p => p.user_id === userId);
    if (!profile) return 'Necunoscut';
    return profile.user_type === 'garage' 
      ? profile.business_name || profile.full_name 
      : profile.full_name;
  };


  const filteredReviews = reviews?.filter(review => {
    const matchesSearch = 
      review.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getProfileName(review.garage_id).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filterRating === 'all' || 
      review.rating === parseInt(filterRating);

    return matchesSearch && matchesFilter;
  });

  return (
    <AdminLayout 
      title="Moderare Recenzii" 
      description="Vizualizează și moderează toate recenziile de pe platformă"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <CardTitle>Recenzii ({filteredReviews?.length || 0})</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Caută recenzii..."
                  className="pl-9 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrează" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate</SelectItem>
                  <SelectItem value="5">5 stele</SelectItem>
                  <SelectItem value="4">4 stele</SelectItem>
                  <SelectItem value="3">3 stele</SelectItem>
                  <SelectItem value="2">2 stele</SelectItem>
                  <SelectItem value="1">1 stea</SelectItem>
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
                  <TableHead>Service</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="w-1/3">Comentariu</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews?.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">
                      {getProfileName(review.garage_id)}
                    </TableCell>
                    <TableCell>
                      {getProfileName(review.customer_id)}
                    </TableCell>
                    <TableCell><StarRating rating={review.rating} size="sm" /></TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {review.comment || 'Fără comentariu'}
                      </p>
                    </TableCell>
                    <TableCell>
                      {format(new Date(review.created_at), 'dd MMM yyyy', { locale: ro })}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => setDeleteReviewId(review.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!filteredReviews || filteredReviews.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nu au fost găsite recenzii.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteReviewId} onOpenChange={() => setDeleteReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Șterge recenzia?</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune nu poate fi anulată. Recenzia va fi ștearsă permanent și va afecta ratingul service-ului.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteReviewId && deleteReviewMutation.mutate(deleteReviewId)}
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminReviews;
