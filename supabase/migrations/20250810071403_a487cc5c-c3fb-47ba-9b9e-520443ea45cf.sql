-- Add photo_path column to barbers table if it doesn't exist
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS photo_path TEXT;