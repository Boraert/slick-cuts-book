// utils/businessHoursHelpers.ts
// Utilities for managing business hours and preventing bookings on closed days

import { supabase } from "@/integrations/supabase/client";

export interface BusinessHours {
  id: string;
  monday_open: boolean;
  monday_start: string;
  monday_end: string;
  tuesday_open: boolean;
  tuesday_start: string;
  tuesday_end: string;
  wednesday_open: boolean;
  wednesday_start: string;
  wednesday_end: string;
  thursday_open: boolean;
  thursday_start: string;
  thursday_end: string;
  friday_open: boolean;
  friday_start: string;
  friday_end: string;
  saturday_open: boolean;
  saturday_start: string;
  saturday_end: string;
  sunday_open: boolean;
  sunday_start: string;
  sunday_end: string;
  created_at: string;
  updated_at: string;
}

const DAY_MAPPING: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

/**
 * Get business hours from database
 */
export const getBusinessHours = async (): Promise<BusinessHours | null> => {
  try {
    const { data, error } = await supabase
      .from('business_hours')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching business hours:', error);
    return null;
  }
};

/**
 * Check if business is open on a specific date
 */
export const isBusinessOpenOnDate = async (date: string | Date): Promise<boolean> => {
  try {
    const businessHours = await getBusinessHours();
    if (!businessHours) {
      // Default: closed on Sunday only
      const dayOfWeek = new Date(date).getDay();
      return dayOfWeek !== 0;
    }

    const dayOfWeek = new Date(date).getDay();
    const dayName = DAY_MAPPING[dayOfWeek];
    const isOpenKey = `${dayName}_open` as keyof BusinessHours;

    return Boolean(businessHours[isOpenKey]);
  } catch (error) {
    console.error('Error checking if business is open:', error);
    return true; // Default to open if error
  }
};

/**
 * Get opening hours for a specific date
 */
export const getOpeningHoursForDate = async (
  date: string | Date
): Promise<{ start: string; end: string } | null> => {
  try {
    const businessHours = await getBusinessHours();
    if (!businessHours) {
      // Default hours
      return { start: '09:00', end: '18:00' };
    }

    const dayOfWeek = new Date(date).getDay();
    const dayName = DAY_MAPPING[dayOfWeek];
    const isOpenKey = `${dayName}_open` as keyof BusinessHours;
    const startKey = `${dayName}_start` as keyof BusinessHours;
    const endKey = `${dayName}_end` as keyof BusinessHours;

    if (!businessHours[isOpenKey]) {
      return null; // Closed
    }

    return {
      start: businessHours[startKey] as string,
      end: businessHours[endKey] as string,
    };
  } catch (error) {
    console.error('Error getting opening hours:', error);
    return null;
  }
};

/**
 * Filter available dates (remove closed days)
 */
export const filterAvailableDates = async (dates: string[]): Promise<string[]> => {
  const businessHours = await getBusinessHours();
  if (!businessHours) {
    // Default: filter out Sundays
    return dates.filter(date => new Date(date).getDay() !== 0);
  }

  return dates.filter(date => {
    const dayOfWeek = new Date(date).getDay();
    const dayName = DAY_MAPPING[dayOfWeek];
    const isOpenKey = `${dayName}_open` as keyof BusinessHours;
    return Boolean(businessHours[isOpenKey]);
  });
};

/**
 * Get day name in Danish
 */
export const getDayName = (date: string | Date, locale: 'da' | 'en' = 'da'): string => {
  const dayNames = {
    da: ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'],
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  };

  const dayOfWeek = new Date(date).getDay();
  return dayNames[locale][dayOfWeek];
};

/**
 * Check if date should be disabled in DatePicker
 */
export const shouldDisableDate = async (date: Date): Promise<boolean> => {
  // Don't allow past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    return true;
  }

  // Check if business is closed on this day
  const isOpen = await isBusinessOpenOnDate(date);
  return !isOpen;
};

/**
 * Get all closed days of the week
 */
export const getClosedDays = async (): Promise<number[]> => {
  try {
    const businessHours = await getBusinessHours();
    if (!businessHours) {
      return [0]; // Default: Sunday closed
    }

    const closedDays: number[] = [];
    Object.keys(DAY_MAPPING).forEach(dayNum => {
      const dayName = DAY_MAPPING[parseInt(dayNum)];
      const isOpenKey = `${dayName}_open` as keyof BusinessHours;
      if (!businessHours[isOpenKey]) {
        closedDays.push(parseInt(dayNum));
      }
    });

    return closedDays;
  } catch (error) {
    console.error('Error getting closed days:', error);
    return [0]; // Default: Sunday closed
  }
};

/**
 * Format opening hours for display
 */
export const formatOpeningHours = (start: string, end: string): string => {
  return `${start} - ${end}`;
};