import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TimePickerProps {
  selectedDate: string;
  selectedTime: string | null;
  barberId: string;
  bookedSlots: string[];
  onTimeSelect: (time: string) => void;
  className?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  booked: boolean;
  isPast: boolean;
  reason?: string;
}

// Business hours configuration
const BUSINESS_HOURS = {
  1: { start: "09:00", end: "18:00" }, // Monday
  2: { start: "09:00", end: "18:00" }, // Tuesday
  3: { start: "09:00", end: "18:00" }, // Wednesday
  4: { start: "09:00", end: "18:00" }, // Thursday
  5: { start: "09:00", end: "18:00" }, // Friday
  6: { start: "09:00", end: "16:00" }, // Saturday
  0: null, // Sunday - Closed
};

export default function TimePicker({ 
  selectedDate, 
  selectedTime, 
  barberId, 
  bookedSlots, 
  onTimeSelect, 
  className 
}: TimePickerProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [message, setMessage] = useState<string>("");
  const { language } = useLanguage();

  // Generate time slots in 30-minute intervals
  const generateTimeSlots = (startTime: string, endTime: string): string[] => {
    const slots: string[] = [];
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    
    while (start < end) {
      slots.push(start.toTimeString().slice(0, 5));
      start.setMinutes(start.getMinutes() + 30);
    }
    
    return slots;
  };

  // Check if a time slot is in the past for today
  const isTimeSlotInPast = (dateString: string, timeSlot: string): boolean => {
    const now = new Date();
    const selectedDateObj = new Date(dateString);
    const isToday = selectedDateObj.toDateString() === now.toDateString();
    
    if (!isToday) return false;
    
    const [hours, minutes] = timeSlot.split(":").map(Number);
    const slotDate = new Date(selectedDateObj);
    slotDate.setHours(hours, minutes, 0, 0);
    
    return slotDate <= now;
  };

  // Get business hours for a specific day
  const getBusinessHoursForDay = (dayOfWeek: number) => {
    return BUSINESS_HOURS[dayOfWeek as keyof typeof BUSINESS_HOURS] || null;
  };

  useEffect(() => {
    if (!selectedDate) {
      setTimeSlots([]);
      setMessage("");
      return;
    }

    const selectedDateObj = new Date(selectedDate);
    const dayOfWeek = selectedDateObj.getDay();
    
    // Check if it's Sunday (closed)
    if (dayOfWeek === 0) {
      setTimeSlots([]);
      setMessage(language === 'da' ? "Vi har lukket om søndagen" : "We are closed on Sundays");
      return;
    }

    // Get business hours for the day
    const businessHours = getBusinessHoursForDay(dayOfWeek);
    if (!businessHours) {
      setTimeSlots([]);
      setMessage(language === 'da' ? "Ingen åbningstider for denne dag" : "No business hours for this day");
      return;
    }

    // Generate all possible time slots for the day
    const allSlots = generateTimeSlots(businessHours.start, businessHours.end);
    
    // Create time slot objects with status information
    const slotsWithStatus: TimeSlot[] = allSlots.map(slot => {
      const isBooked = bookedSlots.includes(slot);
      const isPast = isTimeSlotInPast(selectedDate, slot);
      const available = !isBooked && !isPast;
      
      let reason: string | undefined;
      if (isPast) reason = language === 'da' ? "Fortid" : "Past time";
      else if (isBooked) reason = language === 'da' ? "Optaget" : "Already booked";
      
      return {
        time: slot,
        available,
        booked: isBooked,
        isPast,
        reason
      };
    });

    setTimeSlots(slotsWithStatus);
    setMessage("");
  }, [selectedDate, bookedSlots, language]);

  const handleTimeClick = (time: string, slot: TimeSlot) => {
    if (slot.available) {
      onTimeSelect(time);
    }
  };

  const getSlotButtonClass = (slot: TimeSlot, isSelected: boolean) => {
    const baseClass = "h-12 flex items-center justify-center gap-2 text-sm font-medium rounded-md border transition-colors";
    
    if (isSelected) {
      return `${baseClass} bg-primary text-primary-foreground border-primary`;
    }
    
    if (slot.isPast) {
      return `${baseClass} bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed`;
    }
    
    if (slot.booked) {
      return `${baseClass} bg-red-50 border-red-200 text-red-700 cursor-not-allowed`;
    }
    
    if (slot.available) {
      return `${baseClass} bg-green-50 border-green-200 text-green-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700`;
    }
    
    return `${baseClass} bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed`;
  };

  const availableCount = timeSlots.filter(slot => slot.available).length;
  const totalCount = timeSlots.length;

  return (
    <Card className={`w-full rounded-lg border bg-white shadow-sm ${className || ""}`}>
      <CardHeader className="pb-2 border-b bg-gray-50">
        <CardTitle className="flex items-center justify-between text-base font-semibold text-gray-700">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>{language === 'da' ? 'Vælg Tid' : 'Select Time'}</span>
          </div>
          {timeSlots.length > 0 && (
            <span className="text-sm font-normal text-gray-500">
              {availableCount}/{totalCount} {language === 'da' ? 'ledige' : 'available'}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        {message ? (
          <div className="flex items-center justify-center gap-2 py-8 text-center text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <span>{message}</span>
          </div>
        ) : timeSlots.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-8 text-center text-muted-foreground">
            <Clock className="h-5 w-5 opacity-50" />
            <span>{language === 'da' ? 'Vælg først en dato' : 'Please select a date first'}</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
              {timeSlots.map((slot) => {
                const isSelected = selectedTime === slot.time;
                
                return (
                  <Button
                    key={slot.time}
                    variant="outline"
                    className={getSlotButtonClass(slot, isSelected)}
                    onClick={() => handleTimeClick(slot.time, slot)}
                    disabled={!slot.available}
                    title={slot.reason}
                  >
                    <Clock className="h-3 w-3" />
                    {slot.time}
                  </Button>
                );
              })}
            </div>

            

            
          </>
        )}
      </CardContent>
    </Card>
  );
}