import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Loader2, MessageSquare, Car } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  job_id: string;
  customer_id: string;
  garage_id: string;
  created_at: string;
  jobs: {
    car_make: string;
    car_model: string;
    category: string;
  };
}

const Messages = () => {
  const { conversationId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/autentificare');
    }
  }, [user, authLoading, navigate]);

  // Fetch all conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          jobs (car_make, car_model, category)
        `)
        .or(`customer_id.eq.${user.id},garage_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as Conversation[];
    },
    enabled: !!user,
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId,
  });

  // Get selected conversation details
  const selectedConversation = conversations?.find(c => c.id === conversationId);

  // Fetch other participant's profile
  const { data: otherProfile } = useQuery({
    queryKey: ['conversation-profile', selectedConversation?.id, user?.id],
    queryFn: async () => {
      if (!selectedConversation || !user) return null;
      const otherId = selectedConversation.customer_id === user.id 
        ? selectedConversation.garage_id 
        : selectedConversation.customer_id;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, business_name, user_type')
        .eq('user_id', otherId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedConversation && !!user,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !conversationId) throw new Error('Nu ești autentificat');
      
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
        });
      
      if (error) throw error;

      // Update conversation updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Nu am putut trimite mesajul.',
        variant: 'destructive',
      });
    },
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (!user || !conversationId || !messages?.length) return;

    const unreadMessages = messages.filter(m => !m.is_read && m.sender_id !== user.id);
    if (unreadMessages.length > 0) {
      supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', unreadMessages.map(m => m.id))
        .then();
    }
  }, [messages, user, conversationId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMutation.mutate(newMessage);
  };

  const getParticipantName = (conv: Conversation) => {
    if (!user) return '';
    const isCustomer = conv.customer_id === user.id;
    return isCustomer ? 'Service' : 'Client';
  };

  if (authLoading || conversationsLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20 pb-8">
        <div className="container mx-auto px-4 h-[calc(100vh-12rem)]">
          <div className="grid md:grid-cols-3 gap-4 h-full">
            {/* Conversations List */}
            <Card className="md:col-span-1 flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversații
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  {conversations?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8 px-4">
                      Nu ai conversații încă.
                    </p>
                  ) : (
                    <div className="space-y-1 p-2">
                      {conversations?.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => navigate(`/mesaje/${conv.id}`)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            conv.id === conversationId
                              ? 'bg-primary/10 border border-primary/20'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm text-foreground">
                              {conv.jobs.car_make} {conv.jobs.car_model}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {conv.jobs.category} • {getParticipantName(conv)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Messages Area */}
            <Card className="md:col-span-2 flex flex-col">
              {conversationId && selectedConversation ? (
                <>
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => navigate('/mesaje')}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div>
                        <CardTitle className="text-lg">
                          {otherProfile?.business_name || otherProfile?.full_name || 'Conversație'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation.jobs.car_make} {selectedConversation.jobs.car_model} - {selectedConversation.jobs.category}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 flex flex-col">
                    <ScrollArea className="flex-1 p-4">
                      {messagesLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : messages?.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Niciun mesaj încă. Trimite primul mesaj!
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {messages?.map((msg) => {
                            const isOwn = msg.sender_id === user?.id;
                            return (
                              <div
                                key={msg.id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                                    isOwn
                                      ? 'bg-primary text-primary-foreground rounded-br-md'
                                      : 'bg-muted text-foreground rounded-bl-md'
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                  <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                    {format(new Date(msg.created_at), 'HH:mm', { locale: ro })}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </ScrollArea>
                    <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Scrie un mesaj..."
                        className="flex-1"
                        disabled={sendMutation.isPending}
                      />
                      <Button type="submit" disabled={sendMutation.isPending || !newMessage.trim()}>
                        {sendMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Selectează o conversație pentru a vedea mesajele</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
