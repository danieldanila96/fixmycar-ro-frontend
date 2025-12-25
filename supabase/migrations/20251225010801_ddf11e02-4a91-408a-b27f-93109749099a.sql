-- Drop and recreate the view with security_invoker to respect RLS
DROP VIEW IF EXISTS public.reviews_public;

CREATE VIEW public.reviews_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  garage_id,
  job_id,
  rating,
  comment,
  created_at
FROM public.reviews;

-- Grant SELECT access on the view
GRANT SELECT ON public.reviews_public TO anon;
GRANT SELECT ON public.reviews_public TO authenticated;