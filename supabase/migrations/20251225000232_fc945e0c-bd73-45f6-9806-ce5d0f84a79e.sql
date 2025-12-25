-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  garage_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_id, garage_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Participants can view their conversations"
ON public.conversations
FOR SELECT
USING (auth.uid() = customer_id OR auth.uid() = garage_id);

CREATE POLICY "Participants can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() = customer_id OR auth.uid() = garage_id);

CREATE POLICY "Participants can update their conversations"
ON public.conversations
FOR UPDATE
USING (auth.uid() = customer_id OR auth.uid() = garage_id);

-- RLS policies for messages
CREATE POLICY "Conversation participants can view messages"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.customer_id = auth.uid() OR conversations.garage_id = auth.uid())
  )
);

CREATE POLICY "Conversation participants can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.customer_id = auth.uid() OR conversations.garage_id = auth.uid())
  )
);

CREATE POLICY "Conversation participants can update messages"
ON public.messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.customer_id = auth.uid() OR conversations.garage_id = auth.uid())
  )
);

-- Trigger for updating conversations updated_at
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;