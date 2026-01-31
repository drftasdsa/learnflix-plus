-- Allow students to send messages to teachers
CREATE POLICY "Students can send messages to teachers"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id 
  AND is_broadcast = false 
  AND recipient_id IS NOT NULL
);

-- Teachers can view messages sent to them
CREATE POLICY "Teachers can view messages sent to them"
ON public.messages
FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND recipient_id = auth.uid()
);

-- Teachers can update read status of messages sent to them
CREATE POLICY "Teachers can update read status of received messages"
ON public.messages
FOR UPDATE
USING (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND recipient_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND recipient_id = auth.uid()
);

-- Students can view their own sent messages
CREATE POLICY "Students can view own sent messages"
ON public.messages
FOR SELECT
USING (sender_id = auth.uid());