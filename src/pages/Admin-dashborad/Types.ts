// ─────────────────────────────────────────────────────────────
// types.ts  —  shared interfaces for the Admin Dashboard
// ─────────────────────────────────────────────────────────────

export interface Appointment {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  status: string;
  barber_id: string;
  created_at: string;
}

export interface Barber {
  id: string;
  name: string;
  is_active: boolean;
  photo_path?: string;
}

export interface BarberAvailability {
  id: string;
  barber_id: string;
  from_date: string;
  to_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export type ServiceCategory = "men" | "women";

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: ServiceCategory;
  is_active: boolean;
  created_at: string;
  tags?: string[];
  features?: string[];
  featured?: boolean;
}

export interface DaySchedule {
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

export type WeekSchedule = Record<string, DaySchedule>;