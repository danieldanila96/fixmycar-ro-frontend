-- Add specialties column to profiles table for garage service categories
ALTER TABLE public.profiles 
ADD COLUMN specialties text[] DEFAULT '{}'::text[];