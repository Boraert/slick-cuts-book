-- Create barber availability table
CREATE TABLE public.barber_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(barber_id, date)
);

-- Enable RLS
ALTER TABLE public.barber_availability ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "barber_availability_select_policy" 
ON public.barber_availability 
FOR SELECT 
USING (true);

CREATE POLICY "barber_availability_admin_policy" 
ON public.barber_availability 
FOR ALL 
USING (true);

-- Add default working hours for existing barbers
INSERT INTO public.barber_availability (barber_id, date, start_time, end_time, is_available)
SELECT 
  b.id,
  current_date + interval '1 day' * generate_series(0, 30) as date,
  '09:00'::time as start_time,
  '18:00'::time as end_time,
  true as is_available
FROM public.barbers b
WHERE b.is_active = true;