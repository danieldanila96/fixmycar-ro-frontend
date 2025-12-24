import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export const useQuoteNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('quote-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quotes',
        },
        async (payload) => {
          const newQuote = payload.new as { job_id: string; garage_id: string; price: number };
          
          // Check if current user owns the job
          const { data: job } = await supabase
            .from('jobs')
            .select('id, car_make, car_model, user_id')
            .eq('id', newQuote.job_id)
            .single();

          if (job && job.user_id === user.id) {
            // Get garage info
            const { data: garage } = await supabase
              .from('profiles')
              .select('business_name, full_name')
              .eq('user_id', newQuote.garage_id)
              .single();

            const garageName = garage?.business_name || garage?.full_name || 'Un service';

            toast({
              title: 'Ofertă nouă primită!',
              description: `${garageName} a trimis o ofertă de ${newQuote.price} RON pentru ${job.car_make} ${job.car_model}`,
            });

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['job', newQuote.job_id] });
            queryClient.invalidateQueries({ queryKey: ['quotes', newQuote.job_id] });
            queryClient.invalidateQueries({ queryKey: ['user-jobs'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast, queryClient]);
};
