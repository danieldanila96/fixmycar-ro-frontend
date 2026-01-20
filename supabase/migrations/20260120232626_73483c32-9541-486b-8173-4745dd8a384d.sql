-- Create car_makes table for European brands
CREATE TABLE public.car_makes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  country TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create car_models table
CREATE TABLE public.car_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  make_id UUID NOT NULL REFERENCES public.car_makes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  generation TEXT,
  body_type TEXT,
  year_start INTEGER NOT NULL,
  year_end INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(make_id, name, generation)
);

-- Create car_engines table
CREATE TABLE public.car_engines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID NOT NULL REFERENCES public.car_models(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fuel_type TEXT NOT NULL,
  displacement_cc INTEGER,
  power_hp INTEGER,
  power_kw INTEGER,
  torque_nm INTEGER,
  cylinders INTEGER,
  transmission_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.car_makes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_engines ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Anyone can view car makes" ON public.car_makes FOR SELECT USING (true);
CREATE POLICY "Anyone can view car models" ON public.car_models FOR SELECT USING (true);
CREATE POLICY "Anyone can view car engines" ON public.car_engines FOR SELECT USING (true);

-- Admin-only write access
CREATE POLICY "Admins can manage car makes" ON public.car_makes FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage car models" ON public.car_models FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage car engines" ON public.car_engines FOR ALL USING (public.is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_car_models_make_id ON public.car_models(make_id);
CREATE INDEX idx_car_models_years ON public.car_models(year_start, year_end);
CREATE INDEX idx_car_engines_model_id ON public.car_engines(model_id);
CREATE INDEX idx_car_engines_fuel_type ON public.car_engines(fuel_type);