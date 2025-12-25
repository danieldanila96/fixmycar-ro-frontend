-- Create a function to check if a garage has an active relationship with a customer
-- Active = confirmed/completed appointment OR accepted quote/booking
CREATE OR REPLACE FUNCTION public.has_active_customer_relationship(
  _garage_id uuid,
  _customer_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Check for confirmed or completed appointments
    SELECT 1 FROM public.appointments
    WHERE garage_id = _garage_id
    AND customer_id = _customer_id
    AND status IN ('confirmed', 'completed')
  )
  OR EXISTS (
    -- Check for accepted quotes with bookings
    SELECT 1 FROM public.quotes q
    INNER JOIN public.jobs j ON j.id = q.job_id
    WHERE q.garage_id = _garage_id
    AND j.user_id = _customer_id
    AND q.status = 'accepted'
  )
$$;

-- Create a safe profiles view that conditionally shows phone numbers
CREATE OR REPLACE VIEW public.profiles_safe
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  user_type,
  full_name,
  avatar_url,
  business_name,
  business_address,
  city,
  county,
  rar_authorization,
  description,
  average_rating,
  total_reviews,
  gallery_images,
  specialties,
  latitude,
  longitude,
  operating_hours,
  created_at,
  updated_at,
  -- Only show phone for:
  -- 1. Own profile
  -- 2. Garage profiles (public)
  -- 3. Customer profiles with active relationship
  CASE 
    WHEN user_id = auth.uid() THEN phone
    WHEN user_type = 'garage' THEN phone
    WHEN user_type = 'customer' AND public.has_active_customer_relationship(auth.uid(), user_id) THEN phone
    ELSE NULL
  END AS phone
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_safe TO anon;
GRANT SELECT ON public.profiles_safe TO authenticated;