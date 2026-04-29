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
import TimePicker from "@/components/TimePicker";
import ReCAPTCHA from "react-google-recaptcha";

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
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

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
  if (!recaptchaToken) {
    toast({
      title: "Verification Required",
      description: "Please verify that you are not a robot.",
      variant: "destructive",
    });
    return;
  }

  setIsLoading(true);

  try {
    // 👉 VERIFY CAPTCHA FIRST via Supabase function
    const { data: captchaResult, error: captchaError } =
      await supabase.functions.invoke("verify-recaptcha", {
        body: { token: recaptchaToken },
      });

    if (captchaError || !captchaResult?.success) {
      throw new Error("Captcha verification failed");
    }

    // 👉 EXISTING LOGIC (unchanged)
    const { data: existingAppointment, error: checkError } =
      await supabase
        .from("appointments")
        .select("id")
        .eq("barber_id", data.barberId)
        .eq("appointment_date", data.appointmentDate)
        .eq("appointment_time", data.appointmentTime)
        .eq("status", "confirmed")
        .single();

    if (existingAppointment) {
      toast({
        title: "Time Slot Unavailable",
        description: "Please select another time.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const formattedPhone = formatPhoneForDatabase(data.customerPhone);

    const { error } = await supabase.from("appointments").insert({
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      customer_phone: formattedPhone,
      barber_id: data.barberId,
      service_type: data.serviceType,
      appointment_date: data.appointmentDate,
      appointment_time: data.appointmentTime,
      status: "confirmed",
    });

    if (error) throw error;

    setIsSubmitted(true);

    toast({
      title: "Booking Confirmed!",
      description: "Your appointment has been booked.",
    });
  } catch (error) {
    console.error(error);
    toast({
      title: "Error",
      description: "Booking failed.",
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
        
         
  <iframe
    src="https://frisoer-naerum-32396.planway.com"
    title="Planway Booking"
    className="w-full h-[80vh] rounded-xl shadow-lg border"
  />

           
        
      </div>
    </div>
  );
}
