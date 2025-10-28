-- Create function to increment video view count
CREATE OR REPLACE FUNCTION public.increment_view_count(p_video_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Check if view record exists
  SELECT view_count INTO v_count
  FROM public.video_views
  WHERE video_id = p_video_id AND user_id = p_user_id;

  IF FOUND THEN
    -- Update existing record
    UPDATE public.video_views
    SET view_count = view_count + 1,
        last_viewed_at = now()
    WHERE video_id = p_video_id AND user_id = p_user_id;
  ELSE
    -- Create new record
    INSERT INTO public.video_views (video_id, user_id, view_count, last_viewed_at)
    VALUES (p_video_id, p_user_id, 1, now());
  END IF;
END;
$$;