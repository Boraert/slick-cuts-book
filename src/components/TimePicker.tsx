import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface TimePickerProps {
  selectedDate: string;
  selectedTime: string | null;
  barberId: string;
  bookedSlots?: string[]; // kept for backward-compat but no longer used internally
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

export default function TimePicker({
  selectedDate,
  selectedTime,
  barberId,
  onTimeSelect,
  className,
}: TimePickerProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();

  // Generate time slots in 30-minute intervals between startTime and endTime
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

  // Returns true when the slot has already passed (relevant only for today)
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

  useEffect(() => {
    if (!selectedDate || !barberId) {
      setTimeSlots([]);
      setMessage("");
      return;
    }

    const fetchSlotsFromDB = async () => {
      setIsLoading(true);
      setTimeSlots([]);
      setMessage("");

      try {
        // ── 1. Fetch barber availability windows for the selected date ──────────
        const { data: availability, error: availError } = await (supabase as any)
          .from("barber_availability")
          .select("start_time, end_time")
          .eq("barber_id", barberId)
          .lte("from_date", selectedDate) // window starts on or before the date
          .gte("to_date", selectedDate)   // window ends on or after the date
          .eq("is_available", true);

        if (availError) throw availError;

        if (!availability || availability.length === 0) {
          setMessage(
            language === "da"
              ? "Frisøren er ikke tilgængelig på denne dato"
              : "The barber is not available on this date"
          );
          setIsLoading(false);
          return;
        }

        // ── 2. Build the full list of possible slots from all windows ────────────
        let allSlots: string[] = [];
        availability.forEach((window: { start_time: string; end_time: string }) => {
          allSlots = [
            ...allSlots,
            ...generateTimeSlots(window.start_time, window.end_time),
          ];
        });

        // Deduplicate (in case windows overlap) and sort
        allSlots = [...new Set(allSlots)].sort();

        if (allSlots.length === 0) {
          setMessage(
            language === "da"
              ? "Ingen ledige tider på denne dato"
              : "No available slots on this date"
          );
          setIsLoading(false);
          return;
        }

        // ── 3. Fetch already-confirmed bookings for this barber / date ───────────
        const { data: appointments, error: apptError } = await (supabase as any)
          .from("appointments")
          .select("appointment_time")
          .eq("barber_id", barberId)
          .eq("appointment_date", selectedDate)
          .eq("status", "confirmed");

        if (apptError) throw apptError;

        // Normalise to "HH:MM"
        const booked: string[] =
          appointments?.map((apt: any) =>
            (apt.appointment_time as string).slice(0, 5)
          ) ?? [];

        // ── 4. Build final slot objects ──────────────────────────────────────────
        const slotsWithStatus: TimeSlot[] = allSlots.map((slot) => {
          const isBooked = booked.includes(slot);
          const isPast = isTimeSlotInPast(selectedDate, slot);
          const available = !isBooked && !isPast;

          let reason: string | undefined;
          if (isPast)   reason = language === "da" ? "Fortid"   : "Past time";
          else if (isBooked) reason = language === "da" ? "Optaget" : "Already booked";

          return { time: slot, available, booked: isBooked, isPast, reason };
        });

        setTimeSlots(slotsWithStatus);
      } catch (err) {
        console.error("TimePicker: error fetching slots", err);
        setMessage(
          language === "da"
            ? "Kunne ikke hente ledige tider. Prøv igen."
            : "Could not load available times. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlotsFromDB();
  }, [selectedDate, barberId, language]);

  const handleTimeClick = (slot: TimeSlot) => {
    if (slot.available) onTimeSelect(slot.time);
  };

  const getSlotClass = (slot: TimeSlot, isSelected: boolean) => {
    const base =
      "h-12 flex items-center justify-center gap-1.5 text-sm font-medium rounded-md border transition-colors";

    if (isSelected)
      return `${base} bg-primary text-primary-foreground border-primary`;
    if (slot.isPast)
      return `${base} bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed`;
    if (slot.booked)
      return `${base} bg-red-50 border-red-200 text-red-700 cursor-not-allowed`;
    if (slot.available)
      return `${base} bg-green-50 border-green-200 text-green-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700`;

    return `${base} bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed`;
  };

  return (
    <Card className={`w-full rounded-lg border bg-white shadow-sm ${className ?? ""}`}>
      <CardContent className="p-4">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{language === "da" ? "Henter tider…" : "Loading times…"}</span>
          </div>
        )}

        {/* Error / closed-day message */}
        {!isLoading && message && (
          <div className="flex items-center justify-center gap-2 py-8 text-center text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <span>{message}</span>
          </div>
        )}

        {/* No date / barber selected yet */}
        {!isLoading && !message && timeSlots.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-8 text-center text-muted-foreground">
            <Clock className="h-5 w-5 opacity-50" />
            <span>
              {language === "da"
                ? "Vælg dato og frisør for at se ledige tider"
                : "Select a date and barber to see available times"}
            </span>
          </div>
        )}

        {/* Slot grid */}
        {!isLoading && timeSlots.length > 0 && (
          <>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-green-100 border border-green-300 inline-block" />
                {language === "da" ? "Ledig" : "Available"}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-200 inline-block" />
                {language === "da" ? "Optaget" : "Booked"}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200 inline-block" />
                {language === "da" ? "Fortid" : "Past"}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {timeSlots.map((slot) => {
                const isSelected = selectedTime === slot.time;
                return (
                  <Button
                    key={slot.time}
                    variant="outline"
                    className={getSlotClass(slot, isSelected)}
                    onClick={() => handleTimeClick(slot)}
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