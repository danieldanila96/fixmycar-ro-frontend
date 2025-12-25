import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';

export const useMessageNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const processedMessages = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new as { 
            id: string;
            conversation_id: string; 
            sender_id: string; 
            content: string;
          };
          
          // Skip if we sent this message or already processed it
          if (newMessage.sender_id === user.id) return;
          if (processedMessages.current.has(newMessage.id)) return;
          processedMessages.current.add(newMessage.id);

          // Check if user is part of this conversation
          const { data: conversation } = await supabase
            .from('conversations')
            .select('id, customer_id, garage_id, job_id')
            .eq('id', newMessage.conversation_id)
            .single();

          if (!conversation) return;

          const isParticipant = conversation.customer_id === user.id || conversation.garage_id === user.id;
          if (!isParticipant) return;

          // Don't show notification if already viewing this conversation
          if (location.pathname.includes(`/mesaje/${newMessage.conversation_id}`)) {
            queryClient.invalidateQueries({ queryKey: ['messages', newMessage.conversation_id] });
            return;
          }

          // Get sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('business_name, full_name')
            .eq('user_id', newMessage.sender_id)
            .single();

          const senderName = sender?.business_name || sender?.full_name || 'Cineva';

          toast({
            title: 'Mesaj nou',
            description: `${senderName}: ${newMessage.content.substring(0, 50)}${newMessage.content.length > 50 ? '...' : ''}`,
          });

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['messages', newMessage.conversation_id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast, queryClient, location.pathname, navigate]);
};
