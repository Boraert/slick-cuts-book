-- Fix RLS disabled security issue by enabling RLS on bookings table
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings table
-- Allow public to read bookings for appointment scheduling
CREATE POLICY "bookings_public_select_policy" 
ON public.bookings 
FOR SELECT 
USING (true);

-- Allow authenticated users to insert bookings
CREATE POLICY "bookings_public_insert_policy" 
ON public.bookings 
FOR INSERT 
WITH CHECK (true);

-- Allow admin users to manage all bookings
CREATE POLICY "bookings_admin_manage_policy" 
ON public.bookings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.is_active = true
  )
);