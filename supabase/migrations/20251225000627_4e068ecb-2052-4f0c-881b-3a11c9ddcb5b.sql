-- Create storage bucket for job images
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-images', 'job-images', true);

-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- RLS policies for job-images bucket
CREATE POLICY "Anyone can view job images"
ON storage.objects FOR SELECT
USING (bucket_id = 'job-images');

CREATE POLICY "Authenticated users can upload job images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'job-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own job images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'job-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own job images"
ON storage.objects FOR DELETE
USING (bucket_id = 'job-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS policies for avatars bucket
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add images column to jobs table
ALTER TABLE public.jobs ADD COLUMN images TEXT[] DEFAULT '{}';

-- Update profiles table to ensure avatar_url exists (it already does from schema)