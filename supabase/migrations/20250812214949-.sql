-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.admin_users (user_id, email, is_active)
  VALUES (NEW.id, NEW.email, true);
  RETURN NEW;
END;
$function$;