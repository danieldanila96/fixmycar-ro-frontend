-- Create RAR authorization categories enum
CREATE TYPE public.rar_category AS ENUM (
  'mecanica',           -- Mechanical repairs
  'electrica',          -- Electrical systems
  'caroserie',          -- Bodywork
  'vopsitorie',         -- Paint
  'itp',                -- ITP inspections
  'ac_clima',           -- AC/Climate
  'anvelope',           -- Tires
  'diagnoza',           -- Diagnostics
  'geometrie'           -- Wheel alignment
);

-- Create KYC status enum
CREATE TYPE public.kyc_status AS ENUM (
  'pending',
  'documents_submitted',
  'under_review',
  'approved',
  'rejected'
);

-- Add VIN/CIV fields to jobs table
ALTER TABLE public.jobs
ADD COLUMN vin VARCHAR(17),
ADD COLUMN civ VARCHAR(9),
ADD COLUMN itp_expiry_date DATE;

-- Add Romania-specific fields to profiles for garages
ALTER TABLE public.profiles
ADD COLUMN rar_categories rar_category[] DEFAULT '{}',
ADD COLUMN kyc_status kyc_status DEFAULT 'pending',
ADD COLUMN kyc_documents JSONB DEFAULT '{}',
ADD COLUMN kyc_submitted_at TIMESTAMPTZ,
ADD COLUMN kyc_reviewed_at TIMESTAMPTZ,
ADD COLUMN kyc_rejection_reason TEXT,
ADD COLUMN cui VARCHAR(20),
ADD COLUMN caen_code VARCHAR(10),
ADD COLUMN terms_accepted_at TIMESTAMPTZ,
ADD COLUMN terms_version VARCHAR(10);

-- Create garage_documents table for KYC document storage
CREATE TABLE public.garage_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  garage_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT
);

-- Enable RLS on garage_documents
ALTER TABLE public.garage_documents ENABLE ROW LEVEL SECURITY;

-- Garages can view and upload their own documents
CREATE POLICY "Garages can view own documents"
ON public.garage_documents
FOR SELECT
USING (auth.uid() = garage_id);

CREATE POLICY "Garages can insert own documents"
ON public.garage_documents
FOR INSERT
WITH CHECK (auth.uid() = garage_id);

-- Admins can view and update all documents
CREATE POLICY "Admins can view all documents"
ON public.garage_documents
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all documents"
ON public.garage_documents
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Create ITP reminders table
CREATE TABLE public.itp_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vin VARCHAR(17) NOT NULL,
  civ VARCHAR(9),
  car_make TEXT,
  car_model TEXT,
  itp_expiry_date DATE NOT NULL,
  reminder_sent_30_days BOOLEAN DEFAULT false,
  reminder_sent_7_days BOOLEAN DEFAULT false,
  reminder_sent_1_day BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on itp_reminders
ALTER TABLE public.itp_reminders ENABLE ROW LEVEL SECURITY;

-- Users can manage their own ITP reminders
CREATE POLICY "Users can view own ITP reminders"
ON public.itp_reminders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ITP reminders"
ON public.itp_reminders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ITP reminders"
ON public.itp_reminders
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ITP reminders"
ON public.itp_reminders
FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for KYC documents
CREATE POLICY "Garages can upload own KYC documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Garages can view own KYC documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'kyc-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all KYC documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'kyc-documents' 
  AND public.is_admin(auth.uid())
);

-- Add trigger for updated_at on itp_reminders
CREATE TRIGGER update_itp_reminders_updated_at
  BEFORE UPDATE ON public.itp_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();