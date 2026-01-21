import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useFavorites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select('garage_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data.map(f => f.garage_id);
    },
    enabled: !!user,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  const addFavorite = useMutation({
    mutationFn: async (garageId: string) => {
      if (!user) throw new Error('Trebuie să fii autentificat');
      
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, garage_id: garageId });
      
      if (error) throw error;
      return garageId;
    },
    onMutate: async (garageId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['favorites', user?.id] });
      
      // Snapshot previous value
      const previousFavorites = queryClient.getQueryData<string[]>(['favorites', user?.id]) || [];
      
      // Optimistically update
      queryClient.setQueryData(['favorites', user?.id], [...previousFavorites, garageId]);
      
      return { previousFavorites };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
      toast.success('Adăugat la favorite');
    },
    onError: (_err, _garageId, context) => {
      // Rollback on error
      queryClient.setQueryData(['favorites', user?.id], context?.previousFavorites);
      toast.error('Eroare la adăugarea în favorite');
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (garageId: string) => {
      if (!user) throw new Error('Trebuie să fii autentificat');
      
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('garage_id', garageId);
      
      if (error) throw error;
      return garageId;
    },
    onMutate: async (garageId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['favorites', user?.id] });
      
      // Snapshot previous value
      const previousFavorites = queryClient.getQueryData<string[]>(['favorites', user?.id]) || [];
      
      // Optimistically update
      queryClient.setQueryData(['favorites', user?.id], previousFavorites.filter(id => id !== garageId));
      
      return { previousFavorites };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
      toast.success('Eliminat din favorite');
    },
    onError: (_err, _garageId, context) => {
      // Rollback on error
      queryClient.setQueryData(['favorites', user?.id], context?.previousFavorites);
      toast.error('Eroare la eliminarea din favorite');
    },
  });

  const toggleFavorite = (garageId: string) => {
    if (!user) {
      toast.error('Trebuie să fii autentificat pentru a adăuga la favorite');
      return;
    }
    
    if (favorites.includes(garageId)) {
      removeFavorite.mutate(garageId);
    } else {
      addFavorite.mutate(garageId);
    }
  };

  const isFavorite = (garageId: string) => favorites.includes(garageId);

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
    isToggling: addFavorite.isPending || removeFavorite.isPending,
  };
};
