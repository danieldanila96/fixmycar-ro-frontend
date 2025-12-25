-- Create a public view for reviews that excludes customer_id
CREATE OR REPLACE VIEW public.reviews_public AS
SELECT 
  id,
  garage_id,
  job_id,
  rating,
  comment,
  created_at
FROM public.reviews;

-- Grant SELECT access on the view to authenticated and anon roles
GRANT SELECT ON public.reviews_public TO anon;
GRANT SELECT ON public.reviews_public TO authenticated;