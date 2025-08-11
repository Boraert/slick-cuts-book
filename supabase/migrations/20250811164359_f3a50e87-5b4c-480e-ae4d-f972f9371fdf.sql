-- Add notification_preference column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN notification_preference TEXT CHECK (notification_preference IN ('email', 'sms'));