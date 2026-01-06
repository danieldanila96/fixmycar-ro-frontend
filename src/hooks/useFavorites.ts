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
  });

  const addFavorite = useMutation({
    mutationFn: async (garageId: string) => {
      if (!user) throw new Error('Trebuie să fii autentificat');
      
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, garage_id: garageId });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-favorites-list'] });
      toast.success('Adăugat la favorite');
    },
    onError: () => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-favorites-list'] });
      toast.success('Eliminat din favorite');
    },
    onError: () => {
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
