-- Add GPS coordinates to profiles table
ALTER TABLE public.profiles
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);