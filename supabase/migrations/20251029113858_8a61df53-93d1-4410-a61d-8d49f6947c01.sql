-- Fix user_roles table to allow inserting roles during signup
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Allow users to insert their own role during signup
CREATE POLICY "Users can insert own role"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own roles
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Fix profiles table to only show own profile
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Only allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);