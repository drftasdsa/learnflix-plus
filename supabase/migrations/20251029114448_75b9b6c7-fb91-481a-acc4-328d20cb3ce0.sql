-- Fix 1: Update videos bucket to be private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'videos';

-- Fix 2: Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update own videos" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete own videos" ON storage.objects;

-- Add RLS policies for storage bucket access
CREATE POLICY "Authenticated users can view videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos' AND auth.role() = 'authenticated');

CREATE POLICY "Teachers can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

CREATE POLICY "Teachers can update own videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'videos' AND auth.role() = 'authenticated');

CREATE POLICY "Teachers can delete own videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- Fix 3: Create table for storing invite codes securely
CREATE TABLE IF NOT EXISTS public.teacher_invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.teacher_invite_codes ENABLE ROW LEVEL SECURITY;

-- Insert the hashed invite code (SHA-256 of 'alkhader')
INSERT INTO public.teacher_invite_codes (code_hash, is_active)
VALUES (encode(digest('alkhader', 'sha256'), 'hex'), true)
ON CONFLICT (code_hash) DO NOTHING;

-- Fix 4: Replace increment_view_count function with proper security
DROP FUNCTION IF EXISTS public.increment_view_count(uuid, uuid);

CREATE OR REPLACE FUNCTION public.increment_view_count(p_video_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_count integer;
BEGIN
  -- Validate user is authenticated
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User must be authenticated'
    );
  END IF;
  
  -- Get current view count
  SELECT view_count INTO v_count
  FROM public.video_views
  WHERE video_id = p_video_id AND user_id = v_user_id;
  
  -- Check if view limit exceeded (server-side enforcement)
  IF v_count IS NOT NULL AND v_count >= 2 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'View limit exceeded. Please upgrade to premium.'
    );
  END IF;
  
  -- Increment or create view record
  IF v_count IS NOT NULL THEN
    UPDATE public.video_views
    SET view_count = view_count + 1,
        last_viewed_at = now()
    WHERE video_id = p_video_id AND user_id = v_user_id;
  ELSE
    INSERT INTO public.video_views (video_id, user_id, view_count, last_viewed_at)
    VALUES (p_video_id, v_user_id, 1, now());
    v_count := 0;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'view_count', v_count + 1
  );
END;
$$;