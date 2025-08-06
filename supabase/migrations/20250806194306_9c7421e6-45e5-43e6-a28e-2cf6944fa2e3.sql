-- Update appointments table to make service_type optional and remove price references
ALTER TABLE appointments ALTER COLUMN service_type DROP NOT NULL;