-- Fix: Restrict user role self-assignment to only student and teacher roles
-- Drop the existing unsafe policy
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

-- Create a new policy that only allows student and teacher role assignment
CREATE POLICY "Users can insert own role as student or teacher only" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND role IN ('student'::app_role, 'teacher'::app_role)
);