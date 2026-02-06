
-- Update the admin trigger to use new email
CREATE OR REPLACE FUNCTION public.create_admin_if_needed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email = 'hiihhijhj@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- Allow admins to delete any message
CREATE POLICY "Admins can delete any message"
ON public.messages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all messages
CREATE POLICY "Admins can view all messages"
ON public.messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
