-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new granular SELECT policies

-- 1. Users can always view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Anyone can view garage profiles (they need to be public for the platform to work)
CREATE POLICY "Anyone can view garage profiles" 
ON public.profiles 
FOR SELECT 
USING (user_type = 'garage');

-- 3. Garages can view customer profiles they have conversations with
CREATE POLICY "Garages can view customer profiles from conversations" 
ON public.profiles 
FOR SELECT 
USING (
  user_type = 'customer' 
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.customer_id = profiles.user_id
    AND c.garage_id = auth.uid()
  )
);

-- 4. Garages can view customer profiles from appointments
CREATE POLICY "Garages can view customer profiles from appointments" 
ON public.profiles 
FOR SELECT 
USING (
  user_type = 'customer' 
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.customer_id = profiles.user_id
    AND a.garage_id = auth.uid()
  )
);

-- 5. Garages can view customer profiles from jobs they quoted
CREATE POLICY "Garages can view customer profiles from quotes" 
ON public.profiles 
FOR SELECT 
USING (
  user_type = 'customer' 
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    INNER JOIN public.quotes q ON q.job_id = j.id
    WHERE j.user_id = profiles.user_id
    AND q.garage_id = auth.uid()
  )
);