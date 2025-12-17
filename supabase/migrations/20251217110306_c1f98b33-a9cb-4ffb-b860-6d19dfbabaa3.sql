-- Create messages table for teacher messaging
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID, -- NULL for broadcast messages to all students
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_broadcast BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Teachers can send messages
CREATE POLICY "Teachers can insert messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role) AND sender_id = auth.uid());

-- Teachers can view messages they sent
CREATE POLICY "Teachers can view own sent messages" 
ON public.messages 
FOR SELECT 
USING (has_role(auth.uid(), 'teacher'::app_role) AND sender_id = auth.uid());

-- Students can view broadcast messages
CREATE POLICY "Students can view broadcast messages" 
ON public.messages 
FOR SELECT 
USING (is_broadcast = true);

-- Students can view direct messages sent to them
CREATE POLICY "Students can view direct messages to them" 
ON public.messages 
FOR SELECT 
USING (recipient_id = auth.uid());

-- Students can mark their messages as read
CREATE POLICY "Students can update read status of their messages" 
ON public.messages 
FOR UPDATE 
USING (recipient_id = auth.uid() OR is_broadcast = true)
WITH CHECK (recipient_id = auth.uid() OR is_broadcast = true);

-- Teachers can delete their own messages
CREATE POLICY "Teachers can delete own messages" 
ON public.messages 
FOR DELETE 
USING (has_role(auth.uid(), 'teacher'::app_role) AND sender_id = auth.uid());