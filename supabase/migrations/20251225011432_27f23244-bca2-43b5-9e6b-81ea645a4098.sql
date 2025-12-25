-- Drop existing overly permissive policies for customer profile access
DROP POLICY IF EXISTS "Garages can view customer profiles from conversations" ON public.profiles;
DROP POLICY IF EXISTS "Garages can view customer profiles from appointments" ON public.profiles;
DROP POLICY IF EXISTS "Garages can view customer profiles from quotes" ON public.profiles;

-- Create new restrictive policies - only for ACTIVE relationships

-- Garages can view customer profiles only for CONFIRMED or COMPLETED appointments
CREATE POLICY "Garages can view customer profiles from active appointments" 
ON public.profiles 
FOR SELECT 
USING (
  user_type = 'customer' 
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.customer_id = profiles.user_id
    AND a.garage_id = auth.uid()
    AND a.status IN ('confirmed', 'completed')
  )
);

-- Garages can view customer profiles only for ACCEPTED quotes
CREATE POLICY "Garages can view customer profiles from accepted quotes" 
ON public.profiles 
FOR SELECT 
USING (
  user_type = 'customer' 
  AND EXISTS (
    SELECT 1 FROM public.quotes q
    INNER JOIN public.jobs j ON j.id = q.job_id
    WHERE j.user_id = profiles.user_id
    AND q.garage_id = auth.uid()
    AND q.status = 'accepted'
  )
);