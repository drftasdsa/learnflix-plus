-- Ensure admin account exists and has admin role
-- This is idempotent - won't fail if admin already exists

-- Insert admin user role if not exists (in case admin signed up already)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@learnflix.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Update RLS policy for videos to allow admin to delete any video
DROP POLICY IF EXISTS "Admins can delete any video" ON public.videos;
CREATE POLICY "Admins can delete any video" ON public.videos
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create banned_users table
CREATE TABLE IF NOT EXISTS public.banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by uuid NOT NULL REFERENCES auth.users(id),
  reason text,
  banned_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view banned users
CREATE POLICY "Admins can view banned users" ON public.banned_users
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can ban users
CREATE POLICY "Admins can ban users" ON public.banned_users
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can unban users
CREATE POLICY "Admins can unban users" ON public.banned_users
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to check if user is banned (for use in auth flow)
CREATE OR REPLACE FUNCTION public.is_user_banned(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.banned_users WHERE banned_users.user_id = is_user_banned.user_id
  )
$$;