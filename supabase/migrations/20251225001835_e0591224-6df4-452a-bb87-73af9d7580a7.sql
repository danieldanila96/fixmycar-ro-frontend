-- Add gallery_images column to profiles table for garage photos
ALTER TABLE public.profiles 
ADD COLUMN gallery_images text[] DEFAULT '{}'::text[];

-- Create storage bucket for garage gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('garage-gallery', 'garage-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload gallery images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'garage-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy to allow anyone to view gallery images
CREATE POLICY "Anyone can view gallery images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'garage-gallery');

-- Create policy to allow users to update their own gallery images
CREATE POLICY "Users can update their gallery images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'garage-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy to allow users to delete their own gallery images
CREATE POLICY "Users can delete their gallery images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'garage-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);