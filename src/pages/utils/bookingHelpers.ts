// utils/bookingHelpers.ts
// Utilities for booking submission and validation

import { supabase } from "@/integrations/supabase/client";
import { isTimeSlotAvailable } from "./availabilityHelpers";

export interface BookingData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  barberId: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
}

export interface BookingResult {
  success: boolean;
  message: string;
  appointmentId?: string;
  error?: any;
}

/**
 * Format Danish phone number for database storage
 */
export const formatPhoneForDatabase = (phone: string): string => {
  // Remove any existing country code, spaces, dashes, or other formatting
  const cleanPhone = phone.replace(/^\+45|[\s\-\(\)]/g, '');
  
  // Add Danish country code
  return `+45${cleanPhone}`;
};

/**
 * Format phone number for display (e.g., "12345678" -> "12 34 56 78")
 */
export const formatPhoneForDisplay = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '').slice(0, 8);
  return cleaned.match(/.{1,2}/g)?.join(' ') || cleaned;
};

/**
 * Validate booking data before submission
 */
export const validateBookingData = (data: BookingData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.customerName || data.customerName.length < 2) {
    errors.push("Name must be at least 2 characters");
  }

  if (!data.customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerEmail)) {
    errors.push("Invalid email address");
  }

  if (!data.customerPhone || !/^\d{8}$/.test(data.customerPhone.replace(/\s/g, ''))) {
    errors.push("Phone number must be 8 digits");
  }

  if (!data.barberId) {
    errors.push("Please select a barber");
  }

  if (!data.serviceType) {
    errors.push("Please select a service");
  }

  if (!data.appointmentDate) {
    errors.push("Please select a date");
  }

  if (!data.appointmentTime) {
    errors.push("Please select a time");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Check if time slot is still available before booking
 */
export const checkTimeSlotAvailability = async (
  barberId: string,
  date: string,
  time: string
): Promise<boolean> => {
  return await isTimeSlotAvailable(barberId, date, time);
};

/**
 * Create a new appointment in the database
 */
export const createAppointment = async (data: BookingData): Promise<BookingResult> => {
  try {
    // Validate data
    const validation = validateBookingData(data);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.errors.join(', ')
      };
    }

    // Double-check availability
    const isAvailable = await checkTimeSlotAvailability(
      data.barberId,
      data.appointmentDate,
      data.appointmentTime
    );

    if (!isAvailable) {
      return {
        success: false,
        message: "This time slot is no longer available. Please select another time."
      };
    }

    // Format phone number
    const formattedPhone = formatPhoneForDatabase(data.customerPhone);

    // Insert appointment
    const { data: appointment, error } = await (supabase as any)
      .from("appointments")
      .insert({
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: formattedPhone,
        barber_id: data.barberId,
        service_type: data.serviceType,
        appointment_date: data.appointmentDate,
        appointment_time: data.appointmentTime,
        status: "confirmed",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: "Appointment booked successfully!",
      appointmentId: appointment.id
    };
  } catch (error: any) {
    console.error("Error creating appointment:", error);
    return {
      success: false,
      message: error.message || "Failed to create appointment",
      error
    };
  }
};

/**
 * Send booking confirmation notification
 */
export const sendBookingNotification = async (
  bookingData: BookingData,
  barberName: string,
  serviceName: string,
  servicePrice: number
): Promise<void> => {
  try {
    const formattedPhone = formatPhoneForDatabase(bookingData.customerPhone);

    await supabase.functions.invoke("send-booking-notification-tow", {
      body: {
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: formattedPhone,
        appointmentDate: bookingData.appointmentDate,
        appointmentTime: bookingData.appointmentTime,
        barberName: barberName,
        serviceName: serviceName,
        servicePrice: servicePrice,
      },
    });
  } catch (error) {
    console.error("Error sending booking notification:", error);
    // Don't throw - notification failure shouldn't fail the booking
  }
};

/**
 * Complete booking process (create + notify)
 */
export const processBooking = async (
  bookingData: BookingData,
  barberName: string,
  serviceName: string,
  servicePrice: number
): Promise<BookingResult> => {
  // Create appointment
  const result = await createAppointment(bookingData);

  if (!result.success) {
    return result;
  }

  // Send notification (don't wait for it)
  sendBookingNotification(bookingData, barberName, serviceName, servicePrice).catch(
    err => console.error("Notification failed:", err)
  );

  return result;
};