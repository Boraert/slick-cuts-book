import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfDay, isBefore, isAfter } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { da, enUS, ar } from "date-fns/locale";

interface DatePickerProps {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  className?: string;
}

export default function DatePicker({ selectedDate, onDateSelect, className }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { language } = useLanguage();

  const getDateLocale = () => {
    switch (language) {
      case "da": return da;
      case "ar": return ar;
      default: return enUS;
    }
  };

  // Use startOfDay to avoid disabling "today"
  const today = startOfDay(new Date());
  const maxDate = addDays(today, 365); // One year from today

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Monday-first grid alignment
  const startDay = (startOfMonth(currentMonth).getDay() + 6) % 7;
  const emptyDays = Array.from({ length: startDay });

  const isDateDisabled = (date: Date) => {
    return isBefore(date, today) || isAfter(date, maxDate);
  };

  const handleDateClick = (date: Date) => {
    if (!isDateDisabled(date)) {
      onDateSelect(format(date, "yyyy-MM-dd"));
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev" && isSameMonth(currentMonth, today)) return;
    const base = direction === "prev" ? startOfMonth(currentMonth) : endOfMonth(currentMonth);
    setCurrentMonth(addDays(base, direction === "prev" ? -1 : 1));
  };

  return (
    <Card className={`w-full rounded-lg border bg-white shadow-sm ${className || ""}`}>
      <CardHeader className="pb-2 border-b bg-gray-50">
        <CardTitle className="flex items-center justify-between text-base font-semibold text-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth("prev")}
            disabled={isSameMonth(currentMonth, today)}
            className="hover:bg-gray-200 rounded-md p-1"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <span className="capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: getDateLocale() })}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth("next")}
            className="hover:bg-gray-200 rounded-md p-1"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Weekday header (Mon-Sun) */}
        <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-500 mb-1">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}

          {daysInMonth.map((date) => {
            const dStr = format(date, "yyyy-MM-dd");
            const isSelected = selectedDate === dStr;
            const disabled = isDateDisabled(date);

            return (
              <button
                key={dStr}
                onClick={() => handleDateClick(date)}
                disabled={disabled}
                className={[
                  "h-10 w-full text-sm flex items-center justify-center rounded-md border transition-colors",
                  disabled && "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200",
                  !disabled && !isSelected && "bg-green-50 text-green-700 border-green-300 hover:bg-green-100",
                  isSelected && "bg-green-600 text-white border-green-600",
                ].filter(Boolean).join(" ")}
              >
                {format(date, "d")}
              </button>
            );
          })}
        </div>

        
      </CardContent>
    </Card>
  );
}
