
-- Update increment_view_count to bypass limit for premium subscribers
CREATE OR REPLACE FUNCTION public.increment_view_count(p_video_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_count integer;
  v_has_subscription boolean;
BEGIN
  -- Validate user is authenticated
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User must be authenticated'
    );
  END IF;
  
  -- Check if user has active subscription
  SELECT EXISTS(
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = v_user_id 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_has_subscription;
  
  -- Get current view count
  SELECT view_count INTO v_count
  FROM public.video_views
  WHERE video_id = p_video_id AND user_id = v_user_id;
  
  -- Check if view limit exceeded (only for non-subscribers)
  IF v_count IS NOT NULL AND v_count >= 2 AND NOT v_has_subscription THEN
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
