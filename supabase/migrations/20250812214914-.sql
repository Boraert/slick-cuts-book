-- Fix admin access - only allow admins to manage their own account
-- Update barbers table RLS to allow admin updates
DROP POLICY IF EXISTS "barbers_select_policy" ON public.barbers;

-- Allow authenticated users to view barbers (for public booking)
CREATE POLICY "barbers_public_select_policy" 
ON public.barbers 
FOR SELECT 
USING (true);

-- Allow authenticated admin users to manage barbers data
CREATE POLICY "barbers_admin_manage_policy" 
ON public.barbers 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.is_active = true
  )
);

-- Update admin_users policies to ensure admins can only see their own data
DROP POLICY IF EXISTS "admin_manage_policy" ON public.admin_users;

-- Admin users can view their own profile
CREATE POLICY "admin_select_own_policy" 
ON public.admin_users 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admin users can update their own profile
CREATE POLICY "admin_update_own_policy" 
ON public.admin_users 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Only allow system to insert admin users
CREATE POLICY "admin_insert_system_policy" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (false);

-- Create storage policies for barber photos to allow admin management
CREATE POLICY "barber_photos_admin_select_policy" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'barber-photos');

CREATE POLICY "barber_photos_admin_upload_policy" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'barber-photos' AND 
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.is_active = true
  )
);

CREATE POLICY "barber_photos_admin_update_policy" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'barber-photos' AND 
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.is_active = true
  )
);

CREATE POLICY "barber_photos_admin_delete_policy" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'barber-photos' AND 
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.is_active = true
  )
);

-- Enable realtime for barber photos
ALTER PUBLICATION supabase_realtime ADD TABLE storage.objects;