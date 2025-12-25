-- Drop existing policies that allow garages to view customer profiles directly
DROP POLICY IF EXISTS "Garages can view customer profiles from active appointments" ON public.profiles;
DROP POLICY IF EXISTS "Garages can view customer profiles from accepted quotes" ON public.profiles;

-- Enable RLS on the profiles_safe view to ensure proper security
-- First, we need to recreate it as a security barrier view
DROP VIEW IF EXISTS public.profiles_safe;

CREATE VIEW public.profiles_safe 
WITH (security_barrier = true, security_invoker = true)
AS
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
  -- Phone only visible to: owner, garage profiles, or customers with active relationship
  CASE
    WHEN user_id = auth.uid() THEN phone
    WHEN user_type = 'garage' THEN phone
    WHEN user_type = 'customer' AND public.has_active_customer_relationship(auth.uid(), user_id) THEN phone
    ELSE NULL
  END AS phone
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_safe TO anon, authenticated;