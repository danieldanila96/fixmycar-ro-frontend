import { useState, useEffect, useRef, useCallback } from 'react';
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
import { ArrowLeft, Send, Loader2, MessageSquare, Car, Check, CheckCheck, AlertCircle, RotateCcw } from 'lucide-react';
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

interface PendingMessage {
  id: string;
  content: string;
  status: 'sending' | 'sent' | 'failed';
  timestamp: Date;
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
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    refetchInterval: 5000, // Poll every 5 seconds as backup
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

  // Send message mutation with optimistic updates
  const sendMessage = useCallback(async (content: string, tempId: string) => {
    if (!user || !conversationId) throw new Error('Nu ești autentificat');
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
      })
      .select('id')
      .single();
    
    if (error) throw error;

    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data.id;
  }, [user, conversationId]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !conversationId) return;
    
    const tempId = `temp-${Date.now()}`;
    
    // Add to pending messages (optimistic)
    setPendingMessages(prev => [...prev, {
      id: tempId,
      content: content.trim(),
      status: 'sending',
      timestamp: new Date(),
    }]);
    setNewMessage('');
    
    try {
      await sendMessage(content, tempId);
      
      // Mark as sent
      setPendingMessages(prev => 
        prev.map(m => m.id === tempId ? { ...m, status: 'sent' as const } : m)
      );
      
      // Remove from pending after real message appears
      setTimeout(() => {
        setPendingMessages(prev => prev.filter(m => m.id !== tempId));
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }, 500);
      
    } catch (error) {
      // Mark as failed
      setPendingMessages(prev => 
        prev.map(m => m.id === tempId ? { ...m, status: 'failed' as const } : m)
      );
      toast({
        title: 'Eroare',
        description: 'Nu am putut trimite mesajul. Încearcă din nou.',
        variant: 'destructive',
      });
    }
  }, [conversationId, sendMessage, queryClient, toast]);

  const retryMessage = useCallback((pendingMsg: PendingMessage) => {
    // Remove failed message and resend
    setPendingMessages(prev => prev.filter(m => m.id !== pendingMsg.id));
    handleSendMessage(pendingMsg.content);
  }, [handleSendMessage]);

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

  // Scroll to bottom on initial load and when new messages arrive
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    });
  }, []);

  // Initial scroll when conversation loads (instant)
  useEffect(() => {
    if (messages && messages.length > 0 && !messagesLoading) {
      scrollToBottom('instant');
    }
  }, [conversationId, messagesLoading]); // Only on conversation change

  // Smooth scroll when new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      scrollToBottom('smooth');
    }
  }, [messages?.length, pendingMessages.length, scrollToBottom]);

  // Mark messages as read
  useEffect(() => {
    if (!user || !conversationId || !messages?.length) return;

    const unreadMessages = messages.filter(m => !m.is_read && m.sender_id !== user.id);
    if (unreadMessages.length > 0) {
      const markAsRead = async () => {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadMessages.map(m => m.id));
        
        // Invalidate queries to refresh unread count
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      };
      markAsRead();
    }
  }, [messages, user, conversationId, queryClient]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(newMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(newMessage);
    }
  };

  const isSending = pendingMessages.some(m => m.status === 'sending');

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
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                      <p className="text-sm text-muted-foreground mb-4">Nu ai conversații încă.</p>
                      <p className="text-xs text-muted-foreground">Conversațiile vor apărea aici când trimiți sau primești mesaje de la service-uri.</p>
                    </div>
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
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <MessageSquare className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                          <p className="text-muted-foreground mb-2">Niciun mesaj încă</p>
                          <p className="text-xs text-muted-foreground">Trimite primul mesaj pentru a începe conversația!</p>
                        </div>
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
                                  <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                    <span className="text-xs">
                                      {format(new Date(msg.created_at), 'HH:mm', { locale: ro })}
                                    </span>
                                    {isOwn && msg.is_read && (
                                      <CheckCheck className="h-3 w-3" />
                                    )}
                                    {isOwn && !msg.is_read && (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Pending messages with status */}
                          {pendingMessages.map((pendingMsg) => (
                            <div key={pendingMsg.id} className="flex justify-end">
                              <div className={`max-w-[75%] rounded-2xl px-4 py-2 rounded-br-md ${
                                pendingMsg.status === 'failed' 
                                  ? 'bg-destructive/20 border border-destructive/50' 
                                  : 'bg-primary/80 text-primary-foreground'
                              }`}>
                                <p className="text-sm whitespace-pre-wrap">{pendingMsg.content}</p>
                                <div className="flex items-center gap-1 mt-1 text-xs">
                                  {pendingMsg.status === 'sending' && (
                                    <>
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      <span className="text-primary-foreground/70">Se trimite...</span>
                                    </>
                                  )}
                                  {pendingMsg.status === 'failed' && (
                                    <button
                                      onClick={() => retryMessage(pendingMsg)}
                                      className="flex items-center gap-1 text-destructive hover:underline"
                                    >
                                      <AlertCircle className="h-3 w-3" />
                                      <span>Eșuat</span>
                                      <RotateCcw className="h-3 w-3 ml-1" />
                                      <span>Reîncearcă</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </ScrollArea>
                    <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
                      <Input
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Scrie un mesaj... (Enter pentru a trimite)"
                        className="flex-1"
                        disabled={isSending}
                      />
                      <Button type="submit" disabled={isSending || !newMessage.trim()}>
                        {isSending ? (
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
