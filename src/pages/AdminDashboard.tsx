import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isFuture, parseISO, addDays, startOfWeek } from "date-fns";
import BarberPhotoUpload from "@/components/BarberPhotoUpload";
import {
  Calendar, Clock, Users, LogOut, ArrowUpDown, Filter,
  Plus, Trash2, PencilLine, Save, X, FileText, Upload,
  AlertTriangle, ChevronLeft, ChevronRight, Copy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import servicesData from "@/utils/services.json";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/* =========================
   Types
========================= */

interface Appointment {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  status: string;
  barber_id: string;
  created_at: string;
}

interface Barber {
  id: string;
  name: string;
  is_active: boolean;
  photo_path?: string;
}

interface BarberAvailability {
  id: string;
  barber_id: string;
  from_date: string;
  to_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

type ServiceCategory = "men" | "women";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: ServiceCategory;
  is_active: boolean;
  created_at: string;
  tags?: string[];
  features?: string[];
  featured?: boolean;
}

// Per-day schedule (UI layer — mapped to BarberAvailability rows on save)
interface DaySchedule {
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

type WeekSchedule = Record<string, DaySchedule>; // key = "YYYY-MM-DD"

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_CLOSED: DaySchedule = { isOpen: false, startTime: "09:00", endTime: "18:00" };
const DEFAULT_OPEN: DaySchedule = { isOpen: true, startTime: "09:00", endTime: "18:00" };

/* =========================
   JSON Services Helpers
========================= */

const generateServiceId = (): string =>
  Date.now().toString() + Math.random().toString(36).substr(2, 9);

const processServicesData = (data: any[]): Service[] => {
  if (!Array.isArray(data)) { console.error("Services data is not an array"); return []; }
  return data.map((service: any, index: number) => {
    if (!service.id || !service.name || !service.category)
      console.warn(`Service at index ${index} is missing required fields`);
    return {
      id: String(service.id || generateServiceId()),
      name: String(service.name || `Service ${index + 1}`),
      description: service.description || null,
      price: service.price ? Number(service.price) : null,
      category: (service.category as ServiceCategory) || "men",
      is_active: Boolean(service.is_active !== false),
      created_at: service.created_at || new Date().toISOString(),
      tags: Array.isArray(service.tags) ? service.tags : [],
      features: Array.isArray(service.features) ? service.features : [],
      featured: Boolean(service.featured),
    };
  });
};

const downloadServicesAsJSON = (services: Service[], filename = "services.json") => {
  const blob = new Blob([JSON.stringify(services, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/* =========================
   Weekly Schedule Helpers
========================= */

const getWeekStart = (date: Date): Date => startOfWeek(date, { weekStartsOn: 1 });

const getWeekDates = (weekStart: Date): string[] =>
  Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), "yyyy-MM-dd"));

const buildEmptyWeek = (weekDates: string[]): WeekSchedule =>
  Object.fromEntries(weekDates.map((d) => [d, { ...DEFAULT_CLOSED }]));

const seedWeekFromAvailability = (
  weekDates: string[],
  availability: BarberAvailability[],
  barberId: string
): WeekSchedule => {
  const schedule = buildEmptyWeek(weekDates);
  for (const date of weekDates) {
    const match = availability.find(
      (a) => a.barber_id === barberId && a.from_date <= date && a.to_date >= date
    );
    if (match) {
      schedule[date] = { isOpen: match.is_available, startTime: match.start_time, endTime: match.end_time };
    }
  }
  return schedule;
};

/* =========================
   BarberScheduleCard
========================= */

interface BarberScheduleCardProps {
  barber: Barber;
  availability: BarberAvailability[];
  onUpdate: (barberId: string, isAvailable: boolean, startTime: string, endTime: string, fromDate: string, toDate: string) => Promise<void>;
  onDeleteRange: (availId: string) => Promise<void>;
  onToggleActive: (barber: Barber) => Promise<void>;
  onDeleteBarber: (barber: Barber) => Promise<void>;
  onPhotoUpdate: (photoPath: string) => void;
}

function BarberScheduleCard({
  barber, availability, onUpdate, onDeleteRange, onToggleActive, onDeleteBarber, onPhotoUpdate,
}: BarberScheduleCardProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [schedule, setSchedule] = useState<WeekSchedule>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const weekDates = getWeekDates(weekStart);
  const weekLabel = `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`;
  const isCurrentWeek =
    format(weekStart, "yyyy-MM-dd") === format(getWeekStart(new Date()), "yyyy-MM-dd");

  useEffect(() => {
    setSchedule(seedWeekFromAvailability(weekDates, availability, barber.id));
    setHasChanges(false);
  }, [weekStart, availability, barber.id]);

  const updateDay = (date: string, patch: Partial<DaySchedule>) => {
    setSchedule((prev) => ({ ...prev, [date]: { ...prev[date], ...patch } }));
    setHasChanges(true);
  };

  const applyPreset = (preset: "weekdays" | "everyday" | "closed") => {
    const next: WeekSchedule = {};
    weekDates.forEach((date, i) => {
      if (preset === "closed") next[date] = { ...DEFAULT_CLOSED };
      else if (preset === "everyday") next[date] = { ...DEFAULT_OPEN };
      else next[date] = i < 5 ? { ...DEFAULT_OPEN } : { ...DEFAULT_CLOSED };
    });
    setSchedule(next);
    setHasChanges(true);
  };

  const saveWeek = async () => {
    setIsSaving(true);
    for (const date of weekDates) {
      const day = schedule[date];
      if (!day) continue;
      await onUpdate(barber.id, day.isOpen, day.startTime, day.endTime, date, date);
    }
    setIsSaving(false);
    setHasChanges(false);
  };

  const copyToNextWeek = async () => {
    const nextWeekStart = addDays(weekStart, 7);
    const nextDates = getWeekDates(nextWeekStart);
    setIsSaving(true);
    for (const [i, date] of nextDates.entries()) {
      const src = weekDates[i];
      const day = schedule[src];
      if (!day) continue;
      await onUpdate(barber.id, day.isOpen, day.startTime, day.endTime, date, date);
    }
    setIsSaving(false);
    setWeekStart(nextWeekStart);
  };

  const barberAvailableToday = (() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return availability.some(
      (a) => a.barber_id === barber.id && a.is_available && a.from_date <= today && a.to_date >= today
    );
  })();

  const openDaysCount = weekDates.filter((d) => schedule[d]?.isOpen).length;
  const multiDayRanges = availability.filter(
    (a) => a.barber_id === barber.id && a.from_date !== a.to_date
  );

  return (
    <Card className="overflow-hidden">
      {/* Header: photo + name + status badges */}
      <div className="flex items-center gap-4 px-6 pt-5 pb-4 border-b bg-muted/20">
        <BarberPhotoUpload
          barberId={barber.id}
          barberName={barber.name}
          currentPhotoPath={barber.photo_path}
          onPhotoUpdate={onPhotoUpdate}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold truncate">{barber.name}</h3>
            <Badge className={barber.is_active ? "bg-emerald-100 text-emerald-700 text-xs" : "bg-gray-100 text-gray-500 text-xs"}>
              {barber.is_active ? "Active" : "Inactive"}
            </Badge>
            {barberAvailableToday && (
              <Badge className="bg-blue-100 text-blue-700 text-xs">Working today</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {openDaysCount} day{openDaysCount !== 1 ? "s" : ""} scheduled this week
          </p>
        </div>
      </div>

      <CardContent className="pt-5 space-y-4">
        {/* Week navigator */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => { setWeekStart((w) => addDays(w, -7)); }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <p className="text-sm font-semibold">{weekLabel}</p>
            {isCurrentWeek && <p className="text-xs text-blue-600 font-medium">Current week</p>}
          </div>
          <Button
            variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => { setWeekStart((w) => addDays(w, 7)); }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground shrink-0">Quick set:</span>
          {(["weekdays", "everyday", "closed"] as const).map((preset) => (
            <Button key={preset} variant="outline" size="sm" className="h-7 text-xs px-2.5" onClick={() => applyPreset(preset)}>
              {preset === "weekdays" ? "Mon – Fri" : preset === "everyday" ? "Every day" : "All closed"}
            </Button>
          ))}
        </div>

        {/* Day schedule rows */}
        <div className="rounded-lg border overflow-hidden">
          {weekDates.map((date, i) => {
            const day = schedule[date] ?? { ...DEFAULT_CLOSED };
            const todayRow = isToday(parseISO(date));

            return (
              <div
                key={date}
                className={`flex items-center gap-3 px-4 py-3 transition-colors border-b last:border-b-0
                  ${todayRow ? "bg-blue-50/70" : "bg-background hover:bg-muted/30"}
                  ${!day.isOpen ? "opacity-60" : ""}`}
              >
                {/* Toggle */}
                <Switch
                  checked={day.isOpen}
                  onCheckedChange={(v) => updateDay(date, { isOpen: v })}
                  className="shrink-0"
                />

                {/* Day + date */}
                <div className="w-[4.5rem] shrink-0">
                  <span className={`text-sm font-semibold ${todayRow ? "text-blue-700" : ""}`}>
                    {DAYS_OF_WEEK[i]}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {format(parseISO(date), "d MMM")}
                  </span>
                </div>

                {/* Hours or "Closed" */}
                {day.isOpen ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Input
                      type="time"
                      value={day.startTime}
                      onChange={(e) => updateDay(date, { startTime: e.target.value })}
                      className="h-8 w-[105px] text-sm"
                    />
                    <span className="text-muted-foreground text-sm shrink-0">–</span>
                    <Input
                      type="time"
                      value={day.endTime}
                      onChange={(e) => updateDay(date, { endTime: e.target.value })}
                      className="h-8 w-[105px] text-sm"
                    />
                    {/* Hours summary */}
                    {day.startTime && day.endTime && (
                      <span className="text-xs text-muted-foreground hidden sm:block shrink-0">
                        {(() => {
                          const [sh, sm] = day.startTime.split(":").map(Number);
                          const [eh, em] = day.endTime.split(":").map(Number);
                          const mins = (eh * 60 + em) - (sh * 60 + sm);
                          if (mins <= 0) return "";
                          const h = Math.floor(mins / 60);
                          const m = mins % 60;
                          return m === 0 ? `${h}h` : `${h}h ${m}m`;
                        })()}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="flex-1 text-sm text-muted-foreground italic">Closed</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Save + Copy actions */}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={saveWeek}
            disabled={isSaving || !hasChanges}
            variant={hasChanges ? "default" : "outline"}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Saving…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-3.5 w-3.5" />
                {hasChanges ? "Save Week" : "All saved"}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={copyToNextWeek}
            disabled={isSaving}
            title="Copy this week's schedule to the next week"
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copy to next week
          </Button>
        </div>

        {/* Multi-day overrides (ranges where from != to) */}
        {multiDayRanges.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Multi-day overrides
            </p>
            <div className="space-y-1.5">
              {multiDayRanges.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="font-medium shrink-0">{a.from_date} → {a.to_date}</span>
                    <span className="text-muted-foreground shrink-0">{a.start_time} – {a.end_time}</span>
                    <Badge className={a.is_available ? "bg-emerald-100 text-emerald-700 text-xs" : "bg-red-100 text-red-600 text-xs"}>
                      {a.is_available ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                  <Button
                    size="sm" variant="ghost"
                    className="text-muted-foreground hover:text-destructive ml-2 h-7 w-7 p-0 shrink-0"
                    onClick={() => onDeleteRange(a.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Barber actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" className="flex-1 text-sm" onClick={() => onToggleActive(barber)}>
            {barber.is_active ? "Deactivate" : "Activate"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex-1 text-sm">
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Barber
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {barber.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes {barber.name} and all their availability data.
                  Existing appointments will not be deleted but will show "Unknown" barber.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDeleteBarber(barber)} className="bg-red-600 hover:bg-red-700">
                  Delete Barber
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================
   Main Dashboard
========================= */

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [availability, setAvailability] = useState<BarberAvailability[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "time" | "customer" | "barber" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");  // was "desc"
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "all">("today");
  const [activeMainTab, setActiveMainTab] = useState<"appointments" | "barbers" | "services">("appointments");

  // Add Barber form
  const [newBarberName, setNewBarberName] = useState("");
  const [newBarberActive, setNewBarberActive] = useState(true);

  // Add Service form
  const [svcName, setSvcName] = useState("");
  const [svcDesc, setSvcDesc] = useState("");
  const [svcPrice, setSvcPrice] = useState<string>("");
  const [svcCategory, setSvcCategory] = useState<ServiceCategory | undefined>(undefined);
  const [svcFeatures, setSvcFeatures] = useState<string[]>([]);
  const [svcTags, setSvcTags] = useState<string[]>([]);
  const [svcFeatured, setSvcFeatured] = useState(false);

  // Inline edit state for services
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editSvc, setEditSvc] = useState<{
    name: string; description: string; price: string; category: ServiceCategory;
    tags?: string[]; features?: string[]; featured?: boolean;
  }>({ name: "", description: "", price: "", category: "men", tags: [], features: [], featured: false });

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  /* =========================
     Auth & Data
  ========================= */

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/admin/login"); return; }
    const { data: adminUser, error } = await supabase
      .from("admin_users").select("*").eq("user_id", session.user.id).eq("is_active", true).single();
    if (error || !adminUser) {
      await supabase.auth.signOut();
      navigate("/admin/login");
      toast({ title: "Access Denied", description: "You don't have admin access.", variant: "destructive" });
    }
  };

  const loadData = async () => {
    try {
      const [appointmentsRes, barbersRes] = await Promise.all([
        supabase.from("appointments").select("*").order("appointment_date", { ascending: false }),
        supabase.from("barbers").select("*"),
      ]);
      if (appointmentsRes.error) throw appointmentsRes.error;
      if (barbersRes.error) throw barbersRes.error;
      setAppointments(appointmentsRes.data || []);
      setBarbers(barbersRes.data || []);
      setServices(processServicesData(servicesData));
      await loadAvailability();
    } catch (error) {
      console.error("Error loading data:", error);
      toast({ title: "Error", description: "Failed to load data. Please refresh.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailability = async () => {
    try {
      const { data, error } = await supabase.from("barber_availability").select("*");
      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error("Error loading availability:", error);
      toast({ title: "Error", description: "Failed to load availability.", variant: "destructive" });
    }
  };

  /* =========================
     Appointments
  ========================= */

  const deleteAppointment = async (appointment: Appointment) => {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from("appointments").select("*").eq("id", appointment.id).single();
      if (fetchError) throw fetchError;
      if (!existing) throw new Error("Appointment not found");
      const { data: deleted, error: deleteError } = await supabase
        .from("appointments").delete().eq("id", appointment.id).select();
      if (deleteError) throw deleteError;
      if (!deleted || deleted.length === 0) throw new Error("No rows deleted — check RLS policies");
      await new Promise((r) => setTimeout(r, 500));
      await loadData();
      toast({ title: "Deleted", description: `${appointment.customer_name}'s appointment has been deleted.` });
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to delete.", variant: "destructive" });
    }
  };

  const cancelAppointment = async (appointment: Appointment) => {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from("appointments").select("*").eq("id", appointment.id).single();
      if (fetchError || !existing) throw new Error("Appointment not found");
      const { data: updated, error: updateError } = await supabase
        .from("appointments").update({ status: "cancelled" }).eq("id", appointment.id).select();
      if (updateError || !updated?.length) throw new Error("Failed to update (check RLS policies)");
      const barberName = getBarberName(appointment.barber_id);
      const formattedDate = (() => {
        try { return format(parseISO(appointment.appointment_date), "d. MMMM yyyy"); }
        catch { return appointment.appointment_date; }
      })();
      const { error: notificationError } = await supabase.functions.invoke("send-cancellation-email", {
        body: {
          customerName: appointment.customer_name, customerEmail: appointment.customer_email,
          customerPhone: appointment.customer_phone, appointmentDate: formattedDate,
          appointmentTime: appointment.appointment_time, barberName,
        },
      });
      if (notificationError)
        toast({ title: "Warning", description: "Cancelled but notification failed.", variant: "destructive" });
      await loadData();
      toast({ title: "Cancelled", description: `${appointment.customer_name}'s appointment cancelled.` });
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to cancel.", variant: "destructive" });
    }
  };

  const sortAppointments = (list: Appointment[]) =>
  [...list].sort((a, b) => {
    // Always sort by date+time ascending as tiebreaker
    const dateTimeA = `${a.appointment_date} ${a.appointment_time}`;
    const dateTimeB = `${b.appointment_date} ${b.appointment_time}`;

    let cmp = 0;
    switch (sortBy) {
      case "date": cmp = dateTimeA.localeCompare(dateTimeB); break;
      case "time": cmp = a.appointment_time.localeCompare(b.appointment_time); break;
      case "customer": cmp = a.customer_name.localeCompare(b.customer_name); break;
      case "barber": cmp = getBarberName(a.barber_id).localeCompare(getBarberName(b.barber_id)); break;
      case "status": cmp = a.status.localeCompare(b.status); break;
    }

    // If other columns are equal, fall back to date+time ascending
    return cmp !== 0 ? (sortOrder === "asc" ? cmp : -cmp) : dateTimeA.localeCompare(dateTimeB);
  });

  const filterAppointments = (list: Appointment[]) => {
    let filtered = statusFilter !== "all" ? list.filter((a) => a.status === statusFilter) : list;
    if (activeTab === "today") filtered = filtered.filter((a) => isToday(parseISO(a.appointment_date)));
    if (activeTab === "upcoming") filtered = filtered.filter((a) => isFuture(parseISO(a.appointment_date)));
    return filtered;
  };

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortOrder("asc"); }
  };

  /* =========================
     Availability
  ========================= */

  const isBarberAvailableToday = (barberId: string) => {
    const today = format(new Date(), "yyyy-MM-dd");
    return availability.some(
      (a) => a.barber_id === barberId && a.is_available && a.from_date <= today && a.to_date >= today
    );
  };

  const updateAvailability = async (
    barberId: string, isAvailable: boolean,
    startTime: string, endTime: string,
    fromDate: string, toDate: string
  ) => {
    try {
      const { data: existing, error: selectError } = await supabase
        .from("barber_availability").select("id")
        .eq("barber_id", barberId).eq("from_date", fromDate).eq("to_date", toDate)
        .maybeSingle();
      if (selectError) throw selectError;
      if (existing && (existing as any).id) {
        const { error } = await supabase.from("barber_availability")
          .update({ is_available: isAvailable, start_time: startTime, end_time: endTime })
          .eq("id", (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("barber_availability")
          .insert({ barber_id: barberId, from_date: fromDate, to_date: toDate, is_available: isAvailable, start_time: startTime, end_time: endTime });
        if (error) throw error;
      }
      await loadAvailability();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to update availability.", variant: "destructive" });
    }
  };

  const handleDeleteRange = async (availId: string) => {
    try {
      const { error } = await supabase.from("barber_availability").delete().eq("id", availId);
      if (error) throw error;
      await loadAvailability();
      toast({ title: "Deleted", description: "Availability range removed." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to delete.", variant: "destructive" });
    }
  };

  /* =========================
     Barbers
  ========================= */

  const addBarber = async () => {
    if (!newBarberName.trim()) {
      toast({ title: "Name required", description: "Please enter a barber name.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("barbers")
      .insert([{ name: newBarberName.trim(), is_active: newBarberActive }]);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setNewBarberName(""); setNewBarberActive(true);
    toast({ title: "Barber Added", description: "New barber added successfully." });
    loadData();
  };

  const handleToggleBarberActive = async (barber: Barber) => {
    const { error } = await supabase.from("barbers").update({ is_active: !barber.is_active }).eq("id", barber.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Updated", description: `${barber.name} is now ${barber.is_active ? "Inactive" : "Active"}.` });
    loadData();
  };

  const handleDeleteBarber = async (barber: Barber) => {
    const { error } = await supabase.from("barbers").delete().eq("id", barber.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Deleted", description: `${barber.name} removed.` });
    loadData();
  };

  /* =========================
     Services
  ========================= */

  const addService = () => {
    if (!svcName.trim() || !svcCategory) {
      toast({ title: "Missing fields", description: "Name and Category are required.", variant: "destructive" });
      return;
    }
    const priceNum = svcPrice ? Number(svcPrice) : null;
    if (svcPrice && Number.isNaN(priceNum)) {
      toast({ title: "Invalid price", description: "Please enter a valid number.", variant: "destructive" });
      return;
    }
    setServices((prev) => [
      ...prev,
      {
        id: generateServiceId(), name: svcName.trim(),
        description: svcDesc.trim() || null, price: priceNum,
        category: svcCategory, is_active: true,
        created_at: new Date().toISOString(),
        tags: svcTags.filter((t) => t.trim()),
        features: svcFeatures.filter((f) => f.trim()),
        featured: svcFeatured,
      },
    ]);
    setSvcName(""); setSvcDesc(""); setSvcPrice(""); setSvcCategory(undefined);
    setSvcFeatures([]); setSvcTags([]); setSvcFeatured(false);
    toast({ title: "Service Added", description: "New service added successfully." });
  };

  const toggleServiceActive = (serviceId: string, isActive: boolean) => {
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === serviceId);
      if (idx === -1) { toast({ title: "Error", description: "Service not found", variant: "destructive" }); return prev; }
      const updated = [...prev];
      const old = updated[idx];
      updated[idx] = { ...old, is_active: isActive };
      toast({ title: "Updated", description: `${old.name} is now ${isActive ? "active" : "inactive"}`, duration: 2000 });
      return updated;
    });
  };

  const startEditService = (svc: Service) => {
    setEditingServiceId(svc.id);
    setEditSvc({
      name: svc.name, description: svc.description ?? "",
      price: svc.price != null ? String(svc.price) : "",
      category: svc.category, tags: svc.tags || [],
      features: svc.features || [], featured: svc.featured || false,
    });
  };

  const cancelEditService = () => {
    setEditingServiceId(null);
    setEditSvc({ name: "", description: "", price: "", category: "men", tags: [], features: [], featured: false });
  };

  const saveEditService = (svcId: string) => {
    if (!editSvc.name.trim()) {
      toast({ title: "Name required", description: "Service name cannot be empty.", variant: "destructive" });
      return;
    }
    const priceNum = editSvc.price ? Number(editSvc.price) : null;
    if (editSvc.price && Number.isNaN(priceNum)) {
      toast({ title: "Invalid price", description: "Please enter a valid number.", variant: "destructive" });
      return;
    }
    setServices((prev) =>
      prev.map((s) => s.id === svcId ? {
        ...s, name: editSvc.name.trim(),
        description: editSvc.description.trim() || null, price: priceNum,
        category: editSvc.category,
        tags: editSvc.tags?.filter((t) => t.trim()) || [],
        features: editSvc.features?.filter((f) => f.trim()) || [],
        featured: editSvc.featured || false,
      } : s)
    );
    cancelEditService();
    toast({ title: "Saved", description: "Service updated successfully." });
  };

  const deleteService = (svcId: string) => {
    const svc = services.find((s) => s.id === svcId);
    if (!svc) { toast({ title: "Error", description: "Service not found.", variant: "destructive" }); return; }
    if (!confirm(`Are you sure you want to delete "${svc.name}"?`)) return;
    setServices((prev) => prev.filter((s) => s.id !== svcId));
    toast({ title: "Deleted", description: `${svc.name} has been removed.` });
  };

const getServicePrice = (serviceType: string) => {
  const match = services.find(
    (s) =>
      s.id === serviceType ||
      s.name === serviceType ||
      s.id.toLowerCase().startsWith(serviceType.toLowerCase()) ||
      serviceType.toLowerCase().startsWith(s.id.toLowerCase())
  );
  return match?.price != null ? `DKK ${Number(match.price).toFixed(0)}` : "—";
};


  /* =========================
     Misc
  ========================= */

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/admin"); };

  const getBarberName = (barberId: string) =>
    barbers.find((b) => b.id === barberId)?.name ?? "Unknown";

  const getServiceLabel = (serviceType: string) => {
  const match = services.find(
    (s) =>
      s.id === serviceType ||
      s.name === serviceType ||
      s.id.toLowerCase().startsWith(serviceType.toLowerCase()) ||
      serviceType.toLowerCase().startsWith(s.id.toLowerCase())
  );
  return match?.name ?? serviceType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const todayAppointments = appointments.filter((a) => isToday(parseISO(a.appointment_date)));
  const upcomingAppointments = appointments.filter((a) => isFuture(parseISO(a.appointment_date)));
  const activeBarbers = barbers.filter((b) => isBarberAvailableToday(b.id));
  const displayedAppointments = sortAppointments(filterAppointments(appointments));
  const menServices = services.filter((s) => s.category === "men");
  const womenServices = services.filter((s) => s.category === "women");

  /* =========================
     Render helpers
  ========================= */

  const renderSortButton = (col: typeof sortBy, label: string) => (
    <Button variant="ghost" onClick={() => handleSort(col)} className="h-auto p-0 font-semibold hover:bg-transparent">
      {label} <ArrowUpDown className="ml-2 h-3 w-3" />
    </Button>
  );

  const renderServiceRow = (svc: Service) => {
    const isEditing = editingServiceId === svc.id;
    return (
      <TableRow key={svc.id}>
        <TableCell className="font-medium">
          {isEditing ? (
            <div className="space-y-2">
              <Input value={editSvc.name} onChange={(e) => setEditSvc((p) => ({ ...p, name: e.target.value }))} placeholder="Service name" />
              <Input value={editSvc.description} onChange={(e) => setEditSvc((p) => ({ ...p, description: e.target.value }))} placeholder="Description" />
              <Input value={editSvc.tags?.join(", ") || ""} onChange={(e) => setEditSvc((p) => ({ ...p, tags: e.target.value.split(",").map((t) => t.trim()) }))} placeholder="Tags" />
              <Input value={editSvc.features?.join(", ") || ""} onChange={(e) => setEditSvc((p) => ({ ...p, features: e.target.value.split(",").map((f) => f.trim()) }))} placeholder="Features" />
            </div>
          ) : (
            <div>
              <div className="font-medium">{svc.name}</div>
              {svc.description && <div className="text-sm text-muted-foreground">{svc.description}</div>}
              {!!svc.tags?.length && <div className="text-xs text-blue-600 mt-1">Tags: {svc.tags.join(", ")}</div>}
              {!!svc.features?.length && <div className="text-xs text-green-600 mt-1">Features: {svc.features.join(", ")}</div>}
            </div>
          )}
        </TableCell>
        <TableCell>
          {isEditing
            ? <Input inputMode="decimal" value={editSvc.price} onChange={(e) => setEditSvc((p) => ({ ...p, price: e.target.value }))} placeholder="Price" />
            : svc.price != null ? `DKK ${Number(svc.price).toFixed(0)}` : "-"}
        </TableCell>
        <TableCell>
          {isEditing
            ? <Checkbox checked={editSvc.featured || false} onCheckedChange={(v) => setEditSvc((p) => ({ ...p, featured: Boolean(v) }))} />
            : svc.featured ? <span className="text-yellow-500">⭐ Featured</span> : "-"}
        </TableCell>
        <TableCell>
          <Switch
            key={`${svc.category}-${svc.id}-${svc.is_active}`}
            checked={svc.is_active}
            onCheckedChange={(checked) => toggleServiceActive(svc.id, checked)}
          />
        </TableCell>
        <TableCell className="text-right">
          {isEditing ? (
            <div className="flex justify-end gap-1">
              <Button size="sm" onClick={() => saveEditService(svc.id)}><Save className="h-3 w-3" /></Button>
              <Button size="sm" variant="outline" onClick={cancelEditService}><X className="h-3 w-3" /></Button>
            </div>
          ) : (
            <div className="flex justify-end gap-1">
              <Button size="sm" variant="outline" onClick={() => startEditService(svc)}><PencilLine className="h-3 w-3" /></Button>
              <Button size="sm" variant="destructive" onClick={() => deleteService(svc.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          )}
        </TableCell>
      </TableRow>
    );
  };

  const renderServicesTable = (list: Service[], emptyMessage: string) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Featured</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map(renderServiceRow)}
          {list.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">{emptyMessage}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  /* =========================
     Main render
  ========================= */

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeMainTab} onValueChange={(v) => setActiveMainTab(v as typeof activeMainTab)} className="space-y-6">
          <TabsList>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="barbers">Barber Management</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          {/* ===== Appointments ===== */}
          <TabsContent value="appointments" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todayAppointments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {todayAppointments.filter((a) => a.status === "confirmed").length} confirmed
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
                  <p className="text-xs text-muted-foreground">Next 7 days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Barbers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeBarbers.length}</div>
                  <p className="text-xs text-muted-foreground">Available today</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>Appointments</CardTitle>
                    <CardDescription>Manage and view appointment bookings</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="today">Today ({todayAppointments.length})</TabsTrigger>
                        <TabsTrigger value="upcoming">Upcoming ({upcomingAppointments.length})</TabsTrigger>
                        <TabsTrigger value="all">All</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{renderSortButton("customer", "Customer")}</TableHead>
                        <TableHead>{renderSortButton("date", "Date & Time")}</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>{renderSortButton("barber", "Barber")}</TableHead>
                        <TableHead>{renderSortButton("status", "Status")}</TableHead>
                        <TableHead>Booked On</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedAppointments.slice(0, 50).map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            <div className="font-medium">{appointment.customer_name}</div>
                            <div className="text-sm text-muted-foreground">{appointment.customer_email}</div>
                            {appointment.customer_phone && (
                              <div className="text-sm text-muted-foreground">{appointment.customer_phone}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{format(parseISO(appointment.appointment_date), "MMM d, yyyy")}</div>
                            <div className="text-sm text-muted-foreground">{appointment.appointment_time}</div>
                          </TableCell>
                          
                          <TableCell>{getServiceLabel(appointment.service_type)}</TableCell>
                          <TableCell className="font-medium text-emerald-700">
                          {getServicePrice(appointment.service_type)}</TableCell>
                          <TableCell className="font-medium">{getBarberName(appointment.barber_id)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(parseISO(appointment.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {appointment.status !== "cancelled" && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                                      <AlertTriangle className="h-3 w-3 mr-1" /> Cancel
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Cancel {appointment.customer_name}'s appointment on{" "}
                                        {format(parseISO(appointment.appointment_date), "MMMM d, yyyy")} at {appointment.appointment_time}?
                                        <br /><br />The customer will be notified via email.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => cancelAppointment(appointment)} className="bg-orange-600 hover:bg-orange-700">
                                        Cancel Appointment
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Permanently delete {appointment.customer_name}'s appointment on{" "}
                                      {format(parseISO(appointment.appointment_date), "MMMM d, yyyy")} at {appointment.appointment_time}?
                                      <br /><br /><strong>This cannot be undone.</strong> The customer will be notified.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteAppointment(appointment)} className="bg-red-600 hover:bg-red-700">
                                      Delete Permanently
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {displayedAppointments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      {activeTab === "today" ? "No appointments today."
                        : activeTab === "upcoming" ? "No upcoming appointments."
                        : statusFilter !== "all" ? `No ${statusFilter} appointments found.`
                        : "No appointments found."}
                    </div>
                  )}
                  {displayedAppointments.length > 50 && (
                    <div className="text-center py-4 text-sm text-muted-foreground border-t">
                      Showing first 50 of {displayedAppointments.length} appointments
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Barbers ===== */}
          <TabsContent value="barbers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Add New Barber</CardTitle>
                <CardDescription>Create a new barber profile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
                  <div className="col-span-2">
                    <Label htmlFor="barber-name">Name</Label>
                    <Input id="barber-name" placeholder="e.g. Alex Johnson" value={newBarberName} onChange={(e) => setNewBarberName(e.target.value)} />
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={newBarberActive} onCheckedChange={(v) => setNewBarberActive(!!v)} id="barber-active" />
                      <Label htmlFor="barber-active">Active</Label>
                    </div>
                    <Button onClick={addBarber} className="ml-auto">
                      <Plus className="h-4 w-4 mr-2" /> Add Barber
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Weekly Schedules</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Set each barber's working days and hours, week by week. Toggle individual days on or off,
                  adjust hours, then click <strong>Save Week</strong>. Use <strong>Copy to next week</strong> to
                  roll the same schedule forward without re-entering it each time.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {barbers.map((barber) => (
                  <BarberScheduleCard
                    key={barber.id}
                    barber={barber}
                    availability={availability}
                    onUpdate={updateAvailability}
                    onDeleteRange={handleDeleteRange}
                    onToggleActive={handleToggleBarberActive}
                    onDeleteBarber={handleDeleteBarber}
                    onPhotoUpdate={(photoPath) =>
                      setBarbers((prev) => prev.map((b) => (b.id === barber.id ? { ...b, photo_path: photoPath } : b)))
                    }
                  />
                ))}
                {barbers.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                    No barbers yet. Add one above to get started.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ===== Services ===== */}
          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Export Services Data</CardTitle>
                <CardDescription>Download current services configuration as JSON</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => downloadServicesAsJSON(services)} className="flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Download Services JSON
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Add Service</CardTitle>
                <CardDescription>Add new services for men or women (stored locally)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="svc-name">Name</Label>
                    <Input id="svc-name" placeholder="e.g. Classic Haircut" value={svcName} onChange={(e) => setSvcName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="svc-price">Price (DKK)</Label>
                    <Input id="svc-price" placeholder="e.g. 250" inputMode="decimal" value={svcPrice} onChange={(e) => setSvcPrice(e.target.value)} />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={svcCategory} onValueChange={(v) => setSvcCategory(v as ServiceCategory)}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="men">Men</SelectItem>
                        <SelectItem value="women">Women</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4">
                    <Label htmlFor="svc-desc">Description</Label>
                    <Input id="svc-desc" placeholder="Short description..." value={svcDesc} onChange={(e) => setSvcDesc(e.target.value)} />
                  </div>
                  <div className="col-span-4">
                    <Label htmlFor="svc-features">Features (comma-separated)</Label>
                    <Input id="svc-features" placeholder="e.g. Precision cut, Professional styling" value={svcFeatures.join(", ")} onChange={(e) => setSvcFeatures(e.target.value.split(",").map((f) => f.trim()))} />
                  </div>
                  <div className="col-span-4">
                    <Label htmlFor="svc-tags">Tags (comma-separated)</Label>
                    <Input id="svc-tags" placeholder="e.g. Popular, Classic" value={svcTags.join(", ")} onChange={(e) => setSvcTags(e.target.value.split(",").map((t) => t.trim()))} />
                  </div>
                  <div className="col-span-4 flex items-center gap-2">
                    <Checkbox checked={svcFeatured} onCheckedChange={(v) => setSvcFeatured(!!v)} />
                    <Label>Featured Service</Label>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={addService}><Plus className="h-4 w-4 mr-2" /> Add Service</Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Men's Services ({menServices.length})</CardTitle>
                  <CardDescription>Active and inactive services for men</CardDescription>
                </CardHeader>
                <CardContent>{renderServicesTable(menServices, "No services for men yet.")}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Women's Services ({womenServices.length})</CardTitle>
                  <CardDescription>Active and inactive services for women</CardDescription>
                </CardHeader>
                <CardContent>{renderServicesTable(womenServices, "No services for women yet.")}</CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}