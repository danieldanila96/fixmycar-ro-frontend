-- Add admin role to one of the test users
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'testservice@fixmycar.ro' LIMIT 1)
ON CONFLICT (user_id, role) DO NOTHING;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Create admin-only policies for viewing all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Create admin-only policies for viewing all jobs
CREATE POLICY "Admins can view all jobs" 
ON public.jobs 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Create admin-only policies for deleting reviews (moderation)
CREATE POLICY "Admins can delete reviews" 
ON public.reviews 
FOR DELETE 
USING (public.is_admin(auth.uid()));

-- Create admin-only policies for updating user_roles
CREATE POLICY "Admins can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));