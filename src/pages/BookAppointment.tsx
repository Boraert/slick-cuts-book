import { useState, useEffect, useRef } from "react";
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
import { CheckCircle2, Clock, User, Calendar, Scissors, Star, Sparkles, Timer, Heart, Crown, Palette } from "lucide-react";
import { format } from "date-fns";
import { da, enUS, ar } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import DatePicker from "@/components/DatePicker";
import servicesData from "@/utils/services.json";

interface Service {
  id: string;
  name: string;
  name_da?: string;
  description: string;
  description_da?: string;
  price: number;
  category: "men" | "women";
  duration?: string;
  tags?: string[];
  tags_da?: string[];
  features?: string[];
  features_da?: string[];
  featured?: boolean;
  is_active?: boolean;
  icon?: string;
}

// Updated schema with Danish phone number validation
const bookingSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Please enter a valid email address"),
  customerPhone: z.string()
    .min(8, "Please enter a valid Danish phone number")
    .max(8, "Danish phone number should be 8 digits")
    .regex(/^\d{8}$/, "Please enter 8 digits without spaces or +45"),
  
  barberId: z.string().min(1, "Please select a barber"),
  serviceType: z.string().min(1, "Please select a service"),
  appointmentDate: z.string().min(1, "Please select a date"),
  appointmentTime: z.string().min(1, "Please select a time"),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function BookAppointment() {
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [allTimeSlots, setAllTimeSlots] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<'men' | 'women' | null>(null);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  // Refs for auto-scrolling
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);
  const step5Ref = useRef<HTMLDivElement>(null);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  // Auto-scroll function
  const scrollToStep = (stepNumber: number) => {
    const refs = [null, step1Ref, step2Ref, step3Ref, step4Ref, step5Ref];
    const targetRef = refs[stepNumber];
    
    if (targetRef?.current) {
      setTimeout(() => {
        targetRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }, 150); // Small delay to allow for state updates
    }
  };

  // Icon mapping for services
  const getServiceIcon = (iconName?: string) => {
    const iconMap: { [key: string]: any } = {
      'Scissors': Scissors,
      'Star': Star,
      'Sparkles': Sparkles,
      'Heart': Heart,
      'Crown': Crown,
      'Palette': Palette,
      'Timer': Timer,
    };
    return iconMap[iconName || 'Scissors'] || Scissors;
  };

  // Add the missing formatPrice function
  const formatPrice = (price: number) => {
    return `${price} DKK`;
  };

  // Add the missing handleCategorySelect function
  const handleCategorySelect = (category: 'men' | 'women') => {
    setSelectedCategory(category);
    setSelectedService(""); // Reset selected service when changing category
    form.setValue("serviceType", ""); // Reset form value
  };

  // Phone number formatting function
  const formatPhoneForDatabase = (phone: string): string => {
    // Remove any existing country code, spaces, dashes, or other formatting
    const cleanPhone = phone.replace(/^\+45|[\s\-\(\)]/g, '');
    
    // Add Danish country code
    return `+45${cleanPhone}`;
  };

  // Phone number input formatter
  const handlePhoneInput = (value: string, onChange: (value: string) => void) => {
    // Remove any non-digit characters and limit to 8 digits
    const cleaned = value.replace(/\D/g, '').slice(0, 8);
    
    // Format as XX XX XX XX for display
    let formatted = cleaned;
    if (cleaned.length >= 2) {
      formatted = cleaned.match(/.{1,2}/g)?.join(' ') || cleaned;
    }
    
    // Update form with clean digits only (for validation)
    onChange(cleaned);
    
    return formatted;
  };

  const processServicesData = (data: any[]): Service[] => {
    if (!Array.isArray(data)) {
      console.error('Services data is not an array, using empty array');
      return [];
    }

    return data
      .map((service: any, index: number) => {
        if (!service.id || !service.name || !service.category) {
          console.warn(`Service at index ${index} is missing required fields (id, name, category)`);
        }
        
        return {
          id: String(service.id || `service-${index + 1}`),
          name: String(service.name || `Service ${index + 1}`),
          name_da: service.name_da,
          description: service.description || '',
          description_da: service.description_da,
          price: service.price ? Number(service.price) : 0,
          category: (service.category as "men" | "women") || "men",
          duration: service.duration || undefined,
          tags: Array.isArray(service.tags) ? service.tags : [],
          tags_da: Array.isArray(service.tags_da) ? service.tags_da : [],
          features: Array.isArray(service.features) ? service.features : [],
          features_da: Array.isArray(service.features_da) ? service.features_da : [],
          featured: Boolean(service.featured),
          is_active: Boolean(service.is_active !== false), // default to true
          icon: service.icon
        };
      })
      .filter(service => service.is_active); // Only show active services
  };

  function loadServices() {
    setServicesLoading(true);
    try {
      const processedServices = processServicesData(servicesData);
      setServices(processedServices);
    } catch (error) {
      console.error('Error processing services data:', error);
      setServices([]);
    }
    setServicesLoading(false);
  }

  useEffect(() => {
    loadServices();
    loadBarbers();
  }, []);

  useEffect(() => {
    if (selectedBarber && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedBarber, selectedDate]);

  // Helper function to get localized content
  const getLocalizedContent = (service: Service, field: keyof Service): string | string[] => {
    const danishField = `${field}_da` as keyof Service;
    if (language === 'da' && service[danishField]) {
      return service[danishField] as string | string[];
    }
    return service[field] as string | string[];
  };

  // Filter services by category
  const getServicesByCategory = (category: "men" | "women") =>
    services.filter((s) => s.category === category);

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

      // Format phone number with +45 prefix
      const formattedPhone = formatPhoneForDatabase(data.customerPhone);

      // Insert the new appointment
      const { error } = await (supabase as any)
        .from("appointments")
        .insert({
          customer_name: data.customerName,
          customer_email: data.customerEmail,
          customer_phone: formattedPhone, // Use formatted phone with +45
          barber_id: data.barberId,
          service_type: data.serviceType,
          appointment_date: data.appointmentDate,
          appointment_time: data.appointmentTime,
          status: "confirmed",
        });

      if (error) {
        throw error;
      }

      // Send notification
      try {
        const selectedBarber = barbers.find(b => b.id === data.barberId);
        const selectedServiceDetails = services.find(s => s.id === data.serviceType);
        
         const functionName = "send-booking-notification-tow";

  await supabase.functions.invoke(functionName, {
    body: {
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: formattedPhone, // Use formatted phone with +45
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      barberName: selectedBarber?.name || "Your preferred barber",
      serviceName: selectedServiceDetails?.name || "Selected service",
      servicePrice: selectedServiceDetails?.price || "",
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

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    form.setValue("serviceType", serviceId);
    setCurrentStep(2);
    scrollToStep(2);
  };

  const handleBarberSelect = (barberId: string) => {
    setSelectedBarber(barberId);
    form.setValue("barberId", barberId);
    setCurrentStep(3);
    scrollToStep(3);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    form.setValue("appointmentDate", date);
    setCurrentStep(4);
    scrollToStep(4);
  };

  const handleTimeSelect = (time: string) => {
    form.setValue("appointmentTime", time);
    setCurrentStep(5);
    scrollToStep(5);
  };

  const getDateLocale = () => {
    switch (language) {
      case 'da': return da;
      case 'ar': return ar;
      default: return enUS;
    }
  };

  const getSelectedService = () => {
    return services.find(s => s.id === selectedService);
  };

  if (isSubmitted) {
    const selectedServiceDetails = services.find(s => s.id === form.getValues("serviceType"));
    
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
                    <p><span className="font-medium">{t.service || "Service"}:</span> {selectedServiceDetails?.name} ({selectedServiceDetails?.price})</p>
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

  const menServices = getServicesByCategory("men");
  const womenServices = getServicesByCategory("women");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                {t.bookYourAppointment}
              </h1>
              <p className="text-muted-foreground">
                {t.fillInformation}
              </p>
            </div>

            {/* Step 1: Select Service Category and Service */}
            <Card ref={step1Ref} className={currentStep >= 1 ? "ring-2 ring-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    1
                  </div>
                  {t.selectService || "Select Service"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {!selectedCategory ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="h-24 flex flex-col items-center gap-2 text-center hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors"
                      onClick={() => handleCategorySelect('men')}
                    >
                      <Scissors className="h-8 w-8" />
                      <div>
                        <div className="font-bold">{language === 'da' ? 'Herretjenester' : 'Men\'s Services'}</div>
                        <div className="text-sm text-muted-foreground">{menServices.length} {language === 'da' ? 'tjenester tilgængelige' : 'services available'}</div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-24 flex flex-col items-center gap-2 text-center hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors"
                      onClick={() => handleCategorySelect('women')}
                    >
                      <Heart className="h-8 w-8" />
                      <div>
                        <div className="font-bold">{language === 'da' ? 'Dametjenester' : 'Women\'s Services'}</div>
                        <div className="text-sm text-muted-foreground">{womenServices.length} {language === 'da' ? 'tjenester tilgængelige' : 'services available'}</div>
                      </div>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        {selectedCategory === 'men' 
                          ? (language === 'da' ? 'Herretjenester' : 'Men\'s Services')
                          : (language === 'da' ? 'Dametjenester' : 'Women\'s Services')
                        }
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCategory(null)}
                      >
                        {language === 'da' ? 'Skift Kategori' : 'Change Category'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:gap-3">
                      {(selectedCategory === 'men' ? menServices : womenServices).map((service) => {
                        const IconComponent = getServiceIcon(service.icon);
                        return (
                          <Button
                            key={service.id}
                            variant={selectedService === service.id ? "default" : "outline"}
                            className={`h-auto p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 text-left hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors ${
                              service.featured ? "ring-2 ring-accent" : ""
                            }`}
                            onClick={() => handleServiceSelect(service.id)}
                          >
                            <div className="flex items-start sm:items-center gap-3 w-full sm:w-auto">
                              <IconComponent className="h-5 w-5 mt-0.5 sm:mt-0 flex-shrink-0" />
                              <div className="flex-1 sm:flex-none">
                                <div className="font-medium text-base sm:text-sm leading-tight">
                                  {getLocalizedContent(service, 'name') as string}
                                </div>
                                <div className="text-sm text-muted-foreground mt-0.5 leading-tight">
                                  {getLocalizedContent(service, 'description') as string}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between w-full sm:w-auto sm:text-right gap-4 mt-1 sm:mt-0">
                              <div className="font-bold text-lg sm:text-base text-accent">
                                {formatPrice(service.price)}
                              </div>
                              {service.duration && (
                                <div className="text-sm text-muted-foreground flex items-center">
                                  <Timer className="h-3 w-3 mr-1" />
                                  {service.duration}
                                </div>
                              )}
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Select Barber */}
            <Card ref={step2Ref} className={currentStep >= 2 ? "ring-2 ring-primary" : currentStep < 2 ? "opacity-50" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    2
                  </div>
                  {t.selectBarber}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentStep >= 2 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {barbers.map((barber) => (
                      <Button
                        key={barber.id}
                        variant={selectedBarber === barber.id ? "default" : "outline"}
                        className="h-auto p-4 flex items-center gap-3 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors"
                        onClick={() => handleBarberSelect(barber.id)}
                      >
                        {barber.photo_path ? (
                          <img 
                            src={`${supabase.storage.from('barber-photos').getPublicUrl(barber.photo_path).data.publicUrl}`}
                            alt="Frisør Nærum logo - Professional barber services in Nærum"
                            className="h-16 w-16 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                        <span>{barber.name}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 3: Select Date */}
            <Card ref={step3Ref} className={currentStep >= 3 ? "ring-2 ring-primary" : currentStep < 3 ? "opacity-50" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    3
                  </div>
                  {t.selectDate}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentStep >= 3 && (
                  <div>
                    <DatePicker
                      selectedDate={selectedDate}
                      onDateSelect={(date) => handleDateSelect(date)}
                    />
                   
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 4: Select Time */}
            <Card ref={step4Ref} className={ currentStep >= 4 ? "ring-2 ring-primary" : currentStep < 4 ? "opacity-50" : "" }>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          currentStep >= 4
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        4
                      </div>
                      {t.selectTime}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentStep >= 4 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {allTimeSlots
                          .filter((time) => {
                            if (!selectedDate) return true;

                            const now = new Date();
                            const selected = new Date(selectedDate);
                            const isToday = selected.toDateString() === now.toDateString();

                            if (isToday) {
                              // Parse "HH:MM" into today's date
                              const [hours, minutes] = time.split(":").map(Number);
                              const slotDate = new Date(selected);
                              slotDate.setHours(hours, minutes, 0, 0);

                              return slotDate > now; // only future slots
                            }

                            return true; // keep all for future dates
                          })
                          .map((time) => {
                            const isAvailable = availableSlots.includes(time);
                            const isBooked = bookedSlots.includes(time);
                            const isSelected = form.getValues("appointmentTime") === time;

                            return (
                              <Button
                                key={time}
                                variant={isSelected ? "default" : "outline"}
                                className={`h-12 flex items-center gap-2 transition-colors ${
                                  isSelected
                                    ? "" // Let the default variant handle the dark styling
                                    : isBooked
                                    ? "bg-red-50 border-red-200 text-red-700 cursor-not-allowed hover:bg-red-50"
                                    : isAvailable
                                    ? "bg-green-50 border-green-200 text-green-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700"
                                    : "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                                }`}
                                onClick={() =>
                                  isAvailable && !isBooked && handleTimeSelect(time)
                                }
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

            {/* Step 5: Customer Details */}
            <Card ref={step5Ref} className={currentStep >= 5 ? "ring-2 ring-primary" : currentStep < 5 ? "opacity-50" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 5 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    5
                  </div>
                  {t.customerDetails || "Customer Details"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentStep >= 5 && (
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
                                <div className="relative">
                                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                                    +45
                                  </div>
                                  <Input
                                    placeholder="12 34 56 78"
                                    className="pl-12"
                                    value={field.value ? handlePhoneInput(field.value, () => {}) : ''}
                                    onChange={(e) => {
                                      const formatted = handlePhoneInput(e.target.value, field.onChange);
                                      // Update the display value
                                      e.target.value = formatted;
                                    }}
                                    maxLength={11} // Allow for spaces in display
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-muted-foreground mt-1">
                                {language === 'da' ? 'Indtast 8 cifre uden +45' : 'Enter 8 digits without +45'}
                              </p>
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
                {selectedService && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    {(() => {
                      const service = getSelectedService();
                      const IconComponent = service ? getServiceIcon(service.icon) : Scissors;
                      return <IconComponent className="h-5 w-5 text-primary" />;
                    })()}
                    <div>
                      <p className="font-medium">{getLocalizedContent(getSelectedService()!, 'name') as string}</p>
                      <p className="text-sm text-muted-foreground">{formatPrice(getSelectedService()?.price || 0)}</p>
                    </div>
                  </div>
                )}

                {selectedBarber && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    {(() => {
                      const barber = barbers.find(b => b.id === selectedBarber);
                      return barber?.photo_path ? (
                        <img 
                          src={`${supabase.storage.from('barber-photos').getPublicUrl(barber.photo_path).data.publicUrl}`}
                          alt="Frisør Nærum logo - Professional barber services in Nærum"
                          className="h-10 w-10 rounded-full object-cover"
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

                {!selectedService && !selectedBarber && !selectedDate && !form.getValues("appointmentTime") && (
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