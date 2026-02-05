
-- Create table to track IP addresses and their account limits
CREATE TABLE public.ip_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(ip_address, role)
);

-- Enable RLS
ALTER TABLE public.ip_accounts ENABLE ROW LEVEL SECURITY;

-- Admins can view all IP accounts
CREATE POLICY "Admins can view all ip accounts"
ON public.ip_accounts FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete IP accounts (for bypass approvals)
CREATE POLICY "Admins can delete ip accounts"
ON public.ip_accounts FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create table for bypass requests
CREATE TABLE public.ip_bypass_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  requested_role public.app_role NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

-- Enable RLS
ALTER TABLE public.ip_bypass_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can create bypass requests
CREATE POLICY "Anyone can create bypass requests"
ON public.ip_bypass_requests FOR INSERT
WITH CHECK (true);

-- Admins can view all bypass requests
CREATE POLICY "Admins can view bypass requests"
ON public.ip_bypass_requests FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update bypass requests
CREATE POLICY "Admins can update bypass requests"
ON public.ip_bypass_requests FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete bypass requests
CREATE POLICY "Admins can delete bypass requests"
ON public.ip_bypass_requests FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Function to check if IP can register for a role
CREATE OR REPLACE FUNCTION public.can_ip_register(p_ip_address TEXT, p_role public.app_role)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_count INTEGER;
  v_has_approved_bypass BOOLEAN;
BEGIN
  -- Check if IP already has an account with this role
  SELECT COUNT(*) INTO v_existing_count
  FROM public.ip_accounts
  WHERE ip_address = p_ip_address AND role = p_role;
  
  IF v_existing_count > 0 THEN
    -- Check if there's an approved bypass request
    SELECT EXISTS(
      SELECT 1 FROM public.ip_bypass_requests
      WHERE ip_address = p_ip_address 
      AND requested_role = p_role 
      AND status = 'approved'
    ) INTO v_has_approved_bypass;
    
    IF v_has_approved_bypass THEN
      -- Delete the used bypass request
      DELETE FROM public.ip_bypass_requests
      WHERE ip_address = p_ip_address 
      AND requested_role = p_role 
      AND status = 'approved';
      
      RETURN jsonb_build_object('allowed', true, 'message', 'Bypass approved');
    END IF;
    
    RETURN jsonb_build_object(
      'allowed', false, 
      'message', 'An account with this role already exists from your network. Request admin approval for additional account.'
    );
  END IF;
  
  RETURN jsonb_build_object('allowed', true, 'message', 'Registration allowed');
END;
$$;

-- Function to register IP after successful signup
CREATE OR REPLACE FUNCTION public.register_ip_account(p_ip_address TEXT, p_user_id UUID, p_role public.app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First try to delete existing record if there's an approved bypass
  DELETE FROM public.ip_accounts 
  WHERE ip_address = p_ip_address AND role = p_role;
  
  -- Insert new record
  INSERT INTO public.ip_accounts (ip_address, user_id, role)
  VALUES (p_ip_address, p_user_id, p_role);
END;
$$;
