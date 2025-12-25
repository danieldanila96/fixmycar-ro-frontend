-- Add operating_hours column to profiles table for garages
-- Format: JSON object with day keys (0-6, 0=Sunday) containing {open, close, closed} 
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS operating_hours jsonb DEFAULT '{
  "0": {"closed": true},
  "1": {"open": "08:00", "close": "18:00", "closed": false},
  "2": {"open": "08:00", "close": "18:00", "closed": false},
  "3": {"open": "08:00", "close": "18:00", "closed": false},
  "4": {"open": "08:00", "close": "18:00", "closed": false},
  "5": {"open": "08:00", "close": "18:00", "closed": false},
  "6": {"open": "09:00", "close": "14:00", "closed": false}
}'::jsonb;