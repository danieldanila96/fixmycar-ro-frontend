-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  garage_id UUID NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  service_type TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Customers can view their own appointments
CREATE POLICY "Customers can view their own appointments"
ON public.appointments
FOR SELECT
USING (auth.uid() = customer_id);

-- Garages can view appointments for their service
CREATE POLICY "Garages can view their appointments"
ON public.appointments
FOR SELECT
USING (auth.uid() = garage_id);

-- Customers can create appointments
CREATE POLICY "Customers can create appointments"
ON public.appointments
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Customers can update their pending appointments
CREATE POLICY "Customers can update their pending appointments"
ON public.appointments
FOR UPDATE
USING (auth.uid() = customer_id AND status = 'pending');

-- Garages can update appointments
CREATE POLICY "Garages can update their appointments"
ON public.appointments
FOR UPDATE
USING (auth.uid() = garage_id);

-- Customers can delete their pending appointments
CREATE POLICY "Customers can delete pending appointments"
ON public.appointments
FOR DELETE
USING (auth.uid() = customer_id AND status = 'pending');

-- Create trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();