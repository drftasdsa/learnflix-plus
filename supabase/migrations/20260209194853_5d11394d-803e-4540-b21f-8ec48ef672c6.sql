-- Allow anyone authenticated to see which users have the teacher role (needed for student messaging)
CREATE POLICY "Anyone can view teacher roles"
ON public.user_roles
FOR SELECT
USING (role = 'teacher');
