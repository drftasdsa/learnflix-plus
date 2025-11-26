-- Add DELETE policies for user data management and GDPR compliance

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- Allow users to cancel their own subscription
CREATE POLICY "Users can delete own subscription"
ON public.subscriptions
FOR DELETE
USING (auth.uid() = user_id);

-- Admin-only policy for role management (security-critical)
CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow users to reset their own view history
CREATE POLICY "Users can delete own video views"
ON public.video_views
FOR DELETE
USING (auth.uid() = user_id);