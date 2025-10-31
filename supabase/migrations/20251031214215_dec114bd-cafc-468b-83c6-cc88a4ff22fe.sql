-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow teachers to view all profiles (needed for seeing their students)
CREATE POLICY "Teachers can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role));