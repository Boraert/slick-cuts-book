import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Clock, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { da, enUS, ar } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import DatePicker from "@/components/DatePicker";


const bookingSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Please enter a valid email address"),
  customerPhone: z.string().min(10, "Please enter a valid phone number"),
  barberId: z.string().min(1, "Please select a barber"),
  appointmentDate: z.string().min(1, "Please select a date"),
  appointmentTime: z.string().min(1, "Please select a time"),
  notificationPreference: z.enum(["email", "sms"], {
    required_error: "Please select how you'd like to receive notifications",
  }),
});

type BookingFormData = z.infer<typeof bookingSchema>;


export default function BookAppointment() {
  const [barbers, setBarbers] = useState<any[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [allTimeSlots, setAllTimeSlots] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  useEffect(() => {
    loadBarbers();
  }, []);

  useEffect(() => {
    if (selectedBarber && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedBarber, selectedDate]);

  const loadBarbers = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("barbers")
        .select("*")
        .eq("is_active", true);
      
      if (error) throw error;
      setBarbers(data || []);
    } catch (error) {
      console.error("Error loading barbers:", error);
      toast({
        title: "Error",
        description: "Failed to load barbers. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

 const loadAvailableSlots = async () => {
  try {
    if (!selectedBarber || !selectedDate) return;

    // Get barber availability for the selected date
    const { data: availability, error: availError } = await (supabase as any)
      .from("barber_availability")
      .select("*")
      .eq("barber_id", selectedBarber)
      .lte("from_date", selectedDate) // date >= from_date
      .gte("to_date", selectedDate)   // date <= to_date
      .eq("is_available", true);

    if (availError) throw availError;

    if (!availability || availability.length === 0) {
      // No available slots for this barber on this day
      setAvailableSlots([]);
      setBookedSlots([]);
      setAllTimeSlots([]);
      return;
    }

    // Generate time slots from all availability windows
    let slots: string[] = [];
    availability.forEach((avail: any) => {
      slots = [
        ...slots,
        ...generateTimeSlots(avail.start_time, avail.end_time),
      ];
    });

    // Get booked appointments for this barber/date
    const { data: appointments, error: apptError } = await (supabase as any)
      .from("appointments")
      .select("appointment_time")
      .eq("barber_id", selectedBarber)
      .eq("appointment_date", selectedDate)
      .eq("status", "confirmed");

    if (apptError) throw apptError;

    const booked = appointments?.map((apt: any) => apt.appointment_time.slice(0, 5)) || [];
    const available = slots.filter((slot) => !booked.includes(slot));

    setAllTimeSlots(slots);
    setAvailableSlots(available);
    setBookedSlots(booked);
  } catch (error) {
    console.error("Error loading availability:", error);
    setAvailableSlots([]);
    setBookedSlots([]);
    setAllTimeSlots([]);
  }
};


  const generateTimeSlots = (startTime: string, endTime: string) => {
    const slots = [];
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    
    while (start < end) {
      slots.push(start.toTimeString().slice(0, 5));
      start.setMinutes(start.getMinutes() + 30);
    }
    
    return slots;
  };

  const onSubmit = async (data: BookingFormData) => {
    setIsLoading(true);
    
    try {
      // Check if the time slot is already booked
      const { data: existingAppointment, error: checkError } = await (supabase as any)
        .from("appointments")
        .select("id")
        .eq("barber_id", data.barberId)
        .eq("appointment_date", data.appointmentDate)
        .eq("appointment_time", data.appointmentTime)
        .eq("status", "confirmed")
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingAppointment) {
        toast({
          title: "Time Slot Unavailable",
          description: "This time slot has already been booked. Please select another time.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Insert the new appointment
      const { error } = await (supabase as any)
        .from("appointments")
        .insert({
          customer_name: data.customerName,
          customer_email: data.customerEmail,
          customer_phone: data.customerPhone,
          barber_id: data.barberId,
          service_type: null,
          appointment_date: data.appointmentDate,
          appointment_time: data.appointmentTime,
          status: "confirmed",
          notification_preference: data.notificationPreference,
        });

      if (error) {
        throw error;
      }

      // Send notification
      try {
        const selectedBarber = barbers.find(b => b.id === data.barberId);
        await supabase.functions.invoke('send-booking-notification', {
          body: {
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            appointmentDate: data.appointmentDate,
            appointmentTime: data.appointmentTime,
            barberName: selectedBarber?.name || 'Your preferred barber',
            notificationPreference: data.notificationPreference,
          },
        });
      } catch (notificationError) {
        console.error("Notification error:", notificationError);
        // Don't fail the booking if notification fails
      }

      setIsSubmitted(true);
      toast({
        title: "Booking Confirmed!",
        description: "Your appointment has been successfully booked. Check your email and phone for confirmation.",
      });
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarberSelect = (barberId: string) => {
    setSelectedBarber(barberId);
    form.setValue("barberId", barberId);
    setCurrentStep(2);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    form.setValue("appointmentDate", date);
    setCurrentStep(3);
  };

  const handleTimeSelect = (time: string) => {
    form.setValue("appointmentTime", time);
    setCurrentStep(4);
  };

  const getDateLocale = () => {
    switch (language) {
      case 'da': return da;
      case 'ar': return ar;
      default: return enUS;
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">{t.bookingConfirmed}</CardTitle>
              <CardDescription className="text-lg">
                {t.appointmentSuccessfullyBooked}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">{t.appointmentDetailsTitle}</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><span className="font-medium">{t.date}:</span> {form.getValues("appointmentDate")}</p>
                    <p><span className="font-medium">{t.time}:</span> {form.getValues("appointmentTime")}</p>
                    <p><span className="font-medium">{t.preferredBarber}:</span> {barbers.find(b => b.id === form.getValues("barberId"))?.name}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => setIsSubmitted(false)} variant="outline">
                  {t.bookAnother}
                </Button>
                <Button onClick={() => window.location.href = "/"}>
                  {t.returnHome}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Booking Steps */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                {t.bookYourAppointment}
              </h1>
              <p className="text-muted-foreground">
                {t.fillInformation}
              </p>
            </div>

            {/* Step 1: Select Barber */}
            <Card className={currentStep >= 1 ? "ring-2 ring-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    1
                  </div>
                  {t.selectBarber}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {barbers.map((barber) => (
                    <Button
                      key={barber.id}
                      variant={selectedBarber === barber.id ? "default" : "outline"}
                      className="h-auto p-4 flex items-center gap-3"
                      onClick={() => handleBarberSelect(barber.id)}
                    >
                      {barber.photo_path ? (
                        <img 
                          src={`${supabase.storage.from('barber-photos').getPublicUrl(barber.photo_path).data.publicUrl}`}
                          alt={barber.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                      <span>{barber.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Select Date */}
            <Card
  className={
    currentStep >= 2
      ? "ring-2 ring-primary"
      : currentStep < 2
      ? "opacity-50"
      : ""
  }
>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          currentStep >= 2
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        2
      </div>
      {t.selectDate}
    </CardTitle>
  </CardHeader>
  <CardContent>
    {currentStep >= 2 && (
      <div>
        <DatePicker
          selectedDate={selectedDate}
          onDateSelect={(date) => handleDateSelect(date)}
        />
        <p className="text-sm text-muted-foreground mt-2">
          {t.youCanBook || "You can book appointments up to one year in advance"}
        </p>
      </div>
    )}
  </CardContent>
</Card>

            {/* Step 3: Select Time */}
            <Card className={currentStep >= 3 ? "ring-2 ring-primary" : currentStep < 3 ? "opacity-50" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    3
                  </div>
                  {t.selectTime}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentStep >= 3 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {allTimeSlots.map((time) => {
                      const isAvailable = availableSlots.includes(time);
                      const isBooked = bookedSlots.includes(time);
                      const isSelected = form.getValues("appointmentTime") === time;
                      
                      return (
                       <Button
                          key={time}
                          variant={isSelected ? "default" : "outline"}
                          className={`h-12 flex items-center gap-2 ${
                            isBooked 
                              ? "bg-red-50 border-red-200 text-red-700 cursor-not-allowed hover:bg-red-50" 
                              : isAvailable 
                                ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" 
                                : "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                          }`}
                          onClick={() => isAvailable && !isBooked && handleTimeSelect(time)}
                          disabled={!isAvailable || isBooked}
                        >
                          <Clock className="h-4 w-4" />
                          {time}
                        </Button>
                      );
                    })}
                    {allTimeSlots.length === 0 && selectedDate && (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        {t.noAvailableSlots || "No time slots available for this date"}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 4: Customer Details */}
            <Card className={currentStep >= 4 ? "ring-2 ring-primary" : currentStep < 4 ? "opacity-50" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    4
                  </div>
                  {t.customerDetails || "Customer Details"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentStep >= 4 && (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="customerName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.fullName}</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="customerPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.phoneNumber}</FormLabel>
                              <FormControl>
                                <Input placeholder="+45 12 34 56 78" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.emailAddress}</FormLabel>
                            <FormControl>
                              <Input placeholder="john@example.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notificationPreference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.notificationPreference || "How would you like to receive notifications?"}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t.selectNotificationMethod || "Select notification method"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="email">{t.email || "Email"}</SelectItem>
                                <SelectItem value="sms">{t.sms || "SMS"}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full" disabled={isLoading} size="lg">
                        {isLoading ? t.booking : t.bookAppointment}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Summary */}
          <div className="space-y-6">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>{t.appointmentSummary || "Appointment Summary"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedBarber && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    {(() => {
                      const barber = barbers.find(b => b.id === selectedBarber);
                      return barber?.photo_path ? (
                        <img 
                          src={`${supabase.storage.from('barber-photos').getPublicUrl(barber.photo_path).data.publicUrl}`}
                          alt={barber.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-primary" />
                      );
                    })()}
                    <div>
                      <p className="font-medium">{barbers.find(b => b.id === selectedBarber)?.name}</p>
                      <p className="text-sm text-muted-foreground">{t.preferredBarber}</p>
                    </div>
                  </div>
                )}

                {selectedDate && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{format(new Date(selectedDate), "EEEE, MMMM d, yyyy", { locale: getDateLocale() })}</p>
                      <p className="text-sm text-muted-foreground">{t.date}</p>
                    </div>
                  </div>
                )}

               {form.watch("appointmentTime") && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{form.watch("appointmentTime")}</p>
                      <p className="text-sm text-muted-foreground">{t.time}</p>
                    </div>
                  </div>
                )}

                {!selectedBarber && !selectedDate && !form.getValues("appointmentTime") && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{t.selectOptionsToSee || "Select options to see summary"}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Opening Hours */}
            <Card>
              <CardHeader>
                <CardTitle>{t.openingHours || "Opening Hours"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t.monday || "Monday"}</span>
                  <span>09:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.tuesday || "Tuesday"}</span>
                  <span>09:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.wednesday || "Wednesday"}</span>
                  <span>09:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.thursday || "Thursday"}</span>
                  <span>09:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.friday || "Friday"}</span>
                  <span>09:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.saturday || "Saturday"}</span>
                  <span>09:00 - 16:00</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.sunday || "Sunday"}</span>
                  <span className="text-muted-foreground">{t.closed || "Closed"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}