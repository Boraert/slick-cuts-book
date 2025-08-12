import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { da, enUS, ar } from "date-fns/locale";

interface DatePickerProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export default function DatePicker({ selectedDate, onDateSelect }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const { language } = useLanguage();

  const getDateLocale = () => {
    switch (language) {
      case 'da': return da;
      case 'ar': return ar;
      default: return enUS;
    }
  };

  const today = new Date();
  const maxDate = addDays(today, 365); // One year from today

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  // Add empty cells for days before the start of the month
  const startDay = startOfMonth(currentMonth).getDay();
  const emptyDays = Array(startDay).fill(null);

  const isDateDisabled = (date: Date) => {
    return isBefore(date, today) || isBefore(maxDate, date);
  };

  const handleDateClick = (date: Date) => {
    if (!isDateDisabled(date)) {
      onDateSelect(format(date, "yyyy-MM-dd"));
      setShowCalendar(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && isSameMonth(currentMonth, today)) {
      return; // Don't go to previous months before current month
    }
    
    const newMonth = direction === 'prev' 
      ? addDays(startOfMonth(currentMonth), -1)
      : addDays(endOfMonth(currentMonth), 1);
    
    setCurrentMonth(newMonth);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="date-input">Select Date</Label>
        <div className="relative">
          <Input
            id="date-input"
            type="text"
            value={selectedDate ? format(new Date(selectedDate), "MMMM d, yyyy", { locale: getDateLocale() }) : ""}
            placeholder="Choose a date"
            readOnly
            onClick={() => setShowCalendar(!showCalendar)}
            className="cursor-pointer pr-10"
          />
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {showCalendar && (
        <Card className="absolute z-50 w-80">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
                disabled={isSameMonth(currentMonth, today)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>{format(currentMonth, "MMMM yyyy", { locale: getDateLocale() })}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={index} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {emptyDays.map((_, index) => (
                <div key={`empty-${index}`} className="p-2"></div>
              ))}
              {daysInMonth.map((date) => {
                const isSelected = selectedDate === format(date, "yyyy-MM-dd");
                const disabled = isDateDisabled(date);
                const isCurrentDay = isToday(date);
                
                return (
                  <Button
                    key={date.toISOString()}
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    className={`h-8 w-8 p-0 ${
                      disabled 
                        ? "text-muted-foreground cursor-not-allowed opacity-50" 
                        : isCurrentDay 
                          ? "bg-primary/10 text-primary font-bold"
                          : ""
                    }`}
                    onClick={() => handleDateClick(date)}
                    disabled={disabled}
                  >
                    {format(date, "d")}
                  </Button>
                );
              })}
            </div>
            <div className="mt-4 text-xs text-muted-foreground text-center">
              You can book up to one year in advance
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}