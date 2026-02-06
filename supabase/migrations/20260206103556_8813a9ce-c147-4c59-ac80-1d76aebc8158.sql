-- Allow students to view profiles of teachers (needed for teacher selection in messaging)
CREATE POLICY "Students can view teacher profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = profiles.id
    AND user_roles.role = 'teacher'
  )
);