// utils/availabilityHelpers.ts
// Utilities for checking barber availability

import { supabase } from "@/integrations/supabase/client";

export interface TimeSlot {
  time: string;
  isAvailable: boolean;
  isBooked: boolean;
}

export interface AvailabilityWindow {
  id: string;
  barber_id: string;
  from_date: string;
  to_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

/**
 * Generate time slots in 30-minute intervals
 */
export const generateTimeSlots = (startTime: string, endTime: string): string[] => {
  const slots: string[] = [];
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  
  while (start < end) {
    slots.push(start.toTimeString().slice(0, 5));
    start.setMinutes(start.getMinutes() + 30);
  }
  
  return slots;
};

/**
 * Check if a date falls within an availability range
 */
export const isDateInRange = (date: string, fromDate: string, toDate: string): boolean => {
  const checkDate = new Date(date);
  const from = new Date(fromDate);
  const to = new Date(toDate);
  
  return checkDate >= from && checkDate <= to;
};

/**
 * Get all availability windows for a barber on a specific date
 */
export const getBarberAvailabilityForDate = async (
  barberId: string,
  date: string
): Promise<AvailabilityWindow[]> => {
  try {
    const { data, error } = await (supabase as any)
      .from("barber_availability")
      .select("*")
      .eq("barber_id", barberId)
      .eq("is_available", true)
      .lte("from_date", date)
      .gte("to_date", date);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching barber availability:", error);
    return [];
  }
};

/**
 * Get booked appointments for a barber on a specific date
 */
export const getBookedAppointments = async (
  barberId: string,
  date: string
): Promise<string[]> => {
  try {
    const { data, error } = await (supabase as any)
      .from("appointments")
      .select("appointment_time")
      .eq("barber_id", barberId)
      .eq("appointment_date", date)
      .in("status", ["confirmed", "pending"]);

    if (error) throw error;
    
    // Extract time in HH:mm format
    return (data || []).map((apt: any) => 
      apt.appointment_time.slice(0, 5)
    );
  } catch (error) {
    console.error("Error fetching booked appointments:", error);
    return [];
  }
};

/**
 * Get available time slots for a barber on a specific date
 */
export const getAvailableTimeSlots = async (
  barberId: string,
  date: string
): Promise<TimeSlot[]> => {
  try {
    // Get availability windows
    const availabilityWindows = await getBarberAvailabilityForDate(barberId, date);
    
    if (availabilityWindows.length === 0) {
      return [];
    }

    // Generate all possible time slots from availability windows
    const allSlots: Set<string> = new Set();
    availabilityWindows.forEach((window) => {
      const slots = generateTimeSlots(window.start_time, window.end_time);
      slots.forEach(slot => allSlots.add(slot));
    });

    // Get booked appointments
    const bookedTimes = await getBookedAppointments(barberId, date);
    const bookedSet = new Set(bookedTimes);

    // Create TimeSlot objects
    return Array.from(allSlots)
      .sort()
      .map(time => ({
        time,
        isAvailable: !bookedSet.has(time),
        isBooked: bookedSet.has(time)
      }));
  } catch (error) {
    console.error("Error getting available time slots:", error);
    return [];
  }
};

/**
 * Check if a specific time slot is available
 */
export const isTimeSlotAvailable = async (
  barberId: string,
  date: string,
  time: string
): Promise<boolean> => {
  try {
    // Check if barber has availability at this time
    const availabilityWindows = await getBarberAvailabilityForDate(barberId, date);
    
    const hasAvailabilityWindow = availabilityWindows.some(window => {
      const slotTime = new Date(`1970-01-01T${time}`);
      const startTime = new Date(`1970-01-01T${window.start_time}`);
      const endTime = new Date(`1970-01-01T${window.end_time}`);
      
      return slotTime >= startTime && slotTime < endTime;
    });

    if (!hasAvailabilityWindow) {
      return false;
    }

    // Check if time slot is not already booked
    const { data, error } = await (supabase as any)
      .from("appointments")
      .select("id")
      .eq("barber_id", barberId)
      .eq("appointment_date", date)
      .eq("appointment_time", time)
      .in("status", ["confirmed", "pending"])
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !data; // Available if no appointment found
  } catch (error) {
    console.error("Error checking time slot availability:", error);
    return false;
  }
};

/**
 * Format time for display (e.g., "09:00" -> "9:00 AM")
 */
export const formatTimeDisplay = (time: string, use24Hour: boolean = false): string => {
  if (use24Hour) {
    return time;
  }

  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};